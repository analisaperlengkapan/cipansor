import { TahfidzRecord } from '@cipansor/shared';

export class TahfidzMapper {
  static toSharedRecord(record: any): TahfidzRecord {
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
      grade: record.grade || null,
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
