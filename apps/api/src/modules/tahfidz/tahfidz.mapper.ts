import { TahfidzRecord, TahfidzGrade } from '@cipansor/shared';

export class TahfidzMapper {
  private static calculateGrade(score: number): TahfidzGrade {
    if (score >= 90) return 'MUMTAZ';
    if (score >= 80) return 'JAYYID_JIDDAN';
    if (score >= 70) return 'JAYYID';
    if (score >= 60) return 'MAQBUL';
    return 'RASIB';
  }

  static toSharedRecord(record: any): TahfidzRecord {
    // Determine grade: use existing if available, or calculate from score if present
    let grade = record.grade;
    if (!grade && record.score !== null && record.score !== undefined) {
      grade = this.calculateGrade(record.score);
    }

    return {
      id: record.id,
      studentId: record.studentId,
      activityType: record.activityType,
      surahNumber: record.surahNumber,
      surahName: record.surahName,
      ayahStart: record.ayahStart,
      ayahEnd: record.ayahEnd,
      juz: record.juz,
      totalAyah: record.totalAyah,
      score: record.score,
      grade: grade || null,
      notes: record.notes,
      recordedAt: record.recordedAt,
      recordedById: record.recordedById,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      student: record.student ? {
        ...record.student,
        user: record.student.user ? {
          id: record.student.user.id,
          name: record.student.user.name,
        } : undefined,
        unit: record.student.unit ? {
          id: record.student.unit.id,
          name: record.student.unit.name,
        } : undefined,
      } : undefined,
      recordedBy: record.recordedBy ? {
        id: record.recordedBy.id,
        name: record.recordedBy.name,
      } : undefined,
    };
  }

  static toSharedRecords(records: any[]): TahfidzRecord[] {
    return records.map(r => this.toSharedRecord(r));
  }
}
