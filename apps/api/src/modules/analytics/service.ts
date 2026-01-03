// ==================== ACADEMIC STATISTICS ====================

export async function getAcademicStats(unitId?: string): Promise<AcademicPerformance> {
  const unitFilter = unitId ? { unitId } : {};

  // Filter subject performance by unit if unitId is provided
  const subjectPerformanceFilter = unitId ? { subject: { unitId } } : {};

  const [examStats, gradeDistribution, subjectPerformance, topPerformersData] = await Promise.all([
    // Exam statistics
    prisma.exam.aggregate({
      where: unitFilter,
      _count: true,
    }),
    // Grade distribution
    prisma.grade.groupBy({
      by: ["letterGrade"],
      _count: true,
    }),
    // Average performance by subject
    prisma.grade.groupBy({
      by: ["subjectId"],
      where: subjectPerformanceFilter,
      _avg: { percentage: true }, // Using percentage column from schema
      _count: true,
    }),
    // Top performers (by GPA approximation from grades)
    prisma.grade.groupBy({
      by: ["studentId"],
      _avg: { score: true }, // Using score for now as GPA needs credits weighting
      orderBy: { _avg: { score: "desc" } },
      take: 5
    })
  ]);

  // Get subject names
  const subjectIds = subjectPerformance.map(s => s.subjectId);
  const subjects = await prisma.subject.findMany({
    where: { id: { in: subjectIds } },
    select: { id: true, name: true, code: true },
  });

  // Get student details for top performers
  const topStudentIds = topPerformersData.map(s => s.studentId);
  const topStudents = await prisma.student.findMany({
    where: { id: { in: topStudentIds } },
    include: {
        user: { select: { name: true } },
        enrollments: {
            where: { status: 'active' },
            include: { class: { select: { id: true, name: true } } },
            take: 1
        }
    }
  });

  // Calculate total grades for distribution percentage
  const totalGrades = gradeDistribution.reduce((acc, curr) => acc + curr._count, 0);

  // Calculate average GPA (Estimate based on average scores of top performers or general average)
  // Real GPA requires credit hours. Here we map score to 4.0 scale roughly:
  // >90: 4.0, >80: 3.0, >70: 2.0, >60: 1.0
  // Or just use the average percentage/score scaled.
  const overallAvgScore = await prisma.grade.aggregate({
      _avg: { score: true }
  });
  const avgScoreVal = Number(overallAvgScore._avg.score) || 0;
  const estimatedGPA = (avgScoreVal / 25); // Rough 0-4 scale from 0-100

  // Calculate Pass Rate
  // Calculate exact number of passing grades by joining Grade, Exam (optional), and Subject.
  // Priority: Exam.passingScore > Subject.passingScore > 70 (default)
  // We use queryRaw for this complex join condition not easily expressible in Prisma findMany/aggregate
  // We also group by subject_id to calculate per-subject pass rate efficiently in one query.
  const passingGradesBySubjectResult = await prisma.$queryRaw<Array<{ subject_id: string; count: bigint }>>`
    SELECT g.subject_id, COUNT(*)::bigint as count
    FROM grades g
    LEFT JOIN exams e ON g.exam_id = e.id
    JOIN subjects s ON g.subject_id = s.id
    WHERE g.score >= COALESCE(e.passing_score, s.passing_score, 70)
    ${unitId ? Prisma.sql`AND s.unit_id = ${unitId}` : Prisma.empty}
    GROUP BY g.subject_id
  `;

  // Calculate global passing count by summing up subject counts
  // Note: This assumes that only grades associated with subjects in the current unit are returned, which the SQL enforces.
  const passingGradesCount = passingGradesBySubjectResult.reduce((acc, curr) => acc + Number(curr.count), 0);
  const passRate = totalGrades > 0 ? (passingGradesCount / totalGrades) * 100 : 0;

  // Create a map for quick lookup of passing counts per subject
  const passingMap = new Map<string, number>();
  passingGradesBySubjectResult.forEach(row => {
      passingMap.set(row.subject_id, Number(row.count));
  });

  return {
    averageGpa: Number(estimatedGPA.toFixed(2)),
    passRate: Number(passRate.toFixed(2)),
    topPerformers: topPerformersData.map(p => {
        const student = topStudents.find(s => s.id === p.studentId);
        // Estimate GPA from average score
        const gpa = (Number(p._avg.score) || 0) / 25;
        return {
            studentId: p.studentId,
            studentName: student?.user.name || "Unknown",
            classId: student?.enrollments[0]?.class.id || "",
            className: student?.enrollments[0]?.class.name || "-",
            gpa: Number(gpa.toFixed(2))
        };
    }),
    bySubject: subjectPerformance.map(s => {
      const subject = subjects.find(sub => sub.id === s.subjectId);
      const passingCount = passingMap.get(s.subjectId) || 0;
      const totalCount = s._count;
      const subjectPassRate = totalCount > 0 ? (passingCount / totalCount) * 100 : 0;

      return {
        subjectId: s.subjectId,
        subjectName: subject?.name || "Unknown",
        averageScore: Number(s._avg.percentage?.toFixed(2)) || 0, // Schema has percentage column in Grade
        passRate: Number(subjectPassRate.toFixed(2))
      };
    }).sort((a, b) => b.averageScore - a.averageScore),
    gradeDistribution: gradeDistribution
      .filter(g => g.letterGrade)
      .map(g => ({
        grade: g.letterGrade || "?",
        count: g._count,
        percentage: totalGrades > 0 ? Number(((g._count / totalGrades) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => (a.grade || "").localeCompare(b.grade || "")),
    trend: [], // Still empty as semester trend needs complex historical data
  };
}
