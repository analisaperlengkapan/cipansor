import { prisma } from '@/lib/prisma';
import { ApiError, ErrorCode } from '@/middleware/error';
import RaportMerdekaService from './raport-merdeka.service';
import { generateRaporPesantren } from '../rapor-pesantren/rapor-pesantren.service';
import { AssessmentAnalyticsService } from './analytics.service';

/**
 * Service to generate a unified report combining academic (Merdeka)
 * and religious (Pesantren) data.
 */
export class UnifiedRaportService {
  /**
   * Generate Unified SD IT Raport
   * Combines Kurikulum Merdeka (Academic) and Pesantren (Islamic) data
   */
  static async generateUnifiedRaport(studentId: string, academicYearId: string, semester: number) {
    // 1. Get Student & School Info
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true } },
        unit: { select: { id: true, name: true, logoUrl: true, address: true } },
        enrollments: {
          where: { class: { academicYearId } },
          include: {
            class: {
              select: {
                name: true,
                level: true,
                homeroomTeacher: {
                  include: { user: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Siswa tidak ditemukan');
    }

    const enrollment = student.enrollments[0];
    if (!enrollment) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Data enrollment tidak ditemukan untuk tahun ajaran ini');
    }

    // 2. Run Generators and Holistic Analytics in Parallel for efficiency
    // These services handle their own internal data aggregation
    const holisticFallback = {
      holisticScore: 0,
      breakdown: { academic: null, tahfidz: null, behavior: null, attendance: null, ibadah: null },
      dataCompleteness: 'INSUFFICIENT' as const,
      interpretation: 'Data tidak tersedia',
    };
    const [raportMerdeka, raporPesantren, holistic] = await Promise.all([
      RaportMerdekaService.generateRaportMerdeka(studentId, academicYearId, semester),
      generateRaporPesantren({ studentId, academicYearId, semester, unitId: student.unitId }),
      // Holistic analytics failure should not block raport generation
      AssessmentAnalyticsService.getStudentHolisticAnalytics(studentId, academicYearId)
        .catch(() => holisticFallback),
    ]);

    // 3. Structure the Unified Data
    // Combines both worlds into a single cohesive structure for the frontend/PDF
    return {
      meta: {
        generatedAt: new Date(),
        semester,
        academicYear: raportMerdeka.tahunAjaran?.tahun || 'Unknown',
        formatVersion: '1.1.0',
      },
      school: {
        name: student.unit.name,
        address: student.unit.address,
        logo: student.unit.logoUrl,
      },
      student: {
        id: student.id,
        name: student.user.name,
        nis: student.nis,
        nisn: student.nisn,
        class: enrollment.class.name,
        gradeLevel: enrollment.class.level,
      },
      academic: {
        // From Raport Merdeka (Kurikulum Merdeka Standard)
        intrakurikuler: raportMerdeka.intrakurikuler,
        p5: raportMerdeka.projekP5,
        extracurricular: raportMerdeka.ekstrakurikuler,
        attendance: raportMerdeka.kehadiran,
      },
      islamic: {
        // From Rapor Pesantren (Religious/Character Standard)
        tahfidz: raporPesantren.tahfidz,
        ibadah: raporPesantren.ibadah,
        akhlak: raporPesantren.akhlak,
        kitab: raporPesantren.kitabProgress,
        muhadhoroh: raporPesantren.muhadhoroh,
        muhadatsah: raporPesantren.muhadatsah,
        grade: raporPesantren.overallGrade,
        score: raporPesantren.overallScore,
      },
      remarks: {
        academic: raportMerdeka.catatanWaliKelas,
        islamic: raporPesantren.notes,
        principal: raportMerdeka.catatanKepalaSekolah,
        musyrif: raporPesantren.musyrifNotes,
        holistic: holistic.interpretation,
        recommendation: this.generateDevelopmentRecommendation(holistic),
      },
      signatures: {
        homeroomTeacher: enrollment.class.homeroomTeacher?.user.name,
        principal: 'Kepala Sekolah',
        guardian: 'Orang Tua / Wali',
        date: new Date(),
      },
    };
  }

  /**
   * Get formatted Unified Raport with print layout options
   */
  private static generateDevelopmentRecommendation(holistic: any): string {
    const { breakdown } = holistic;
    const genericMessage = "Pertahankan prestasi dan terus kembangkan potensi diri di segala aspek.";
    // Filter out null values (dimensions without data) before finding the lowest.
    // This prevents null→NaN from being treated as the weakest dimension.
    const entries: [string, number][] = Object.entries(breakdown)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => [k, Number(v)] as [string, number]);
    if (entries.length === 0 || holistic.interpretation === 'Data tidak tersedia' || holistic.dataCompleteness === 'INSUFFICIENT') {
      return genericMessage;
    }
    const lowest = entries.reduce((a, b) => a[1] <= b[1] ? a : b, entries[0]);

    // If the weakest dimension already scores >= 80, the student is performing
    // well across all available dimensions — return a generic encouragement
    // instead of a misleading improvement recommendation (e.g., recommending
    // behavior improvement when behaviorScore is 100).
    if (lowest[1] >= 80) {
      return genericMessage;
    }

    const recommendations: Record<string, string> = {
      academic: "Fokus pada peningkatan jam belajar mandiri dan konsultasi dengan guru mata pelajaran yang nilainya masih di bawah KKM.",
      tahfidz: "Tingkatkan intensitas murojaah harian dan pastikan setoran ziyadah konsisten sesuai target juz per semester.",
      behavior: "Perlu bimbingan intensif dalam kedisiplinan dan kepatuhan terhadap tata tertib pesantren.",
      attendance: "Tingkatkan kedisiplinan dalam kehadiran di kelas dan kegiatan wajib lainnya.",
      ibadah: "Meningkatkan kesadaran dalam menjalankan ibadah yaumiyah secara mandiri dan tepat waktu."
    };

    return recommendations[lowest[0]] || genericMessage;
  }

  static async getPrintData(studentId: string, academicYearId: string, semester: number) {
    const data = await this.generateUnifiedRaport(studentId, academicYearId, semester);

    return {
      ...data,
      layout: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        showSchoolLogo: true,
        showIslamicSeal: true,
      },
    };
  }
}
