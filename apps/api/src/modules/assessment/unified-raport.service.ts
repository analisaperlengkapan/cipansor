import { prisma } from '@/lib/prisma';
import { ApiError, ErrorCode } from '@/middleware/error';
import RaportMerdekaService from './raport-merdeka.service';
import { generateRaporPesantren } from '../rapor-pesantren/rapor-pesantren.service';

export class UnifiedRaportService {
  /**
   * Generate Unified SD IT Raport
   * Combines Kurikulum Merdeka (Academic) and Pesantren (Islamic) data
   */
  static async generateUnifiedRaport(
    studentId: string,
    academicYearId: string,
    semester: number
  ) {
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
                  include: { user: { select: { name: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Siswa tidak ditemukan');
    }

    const enrollment = student.enrollments[0];
    if (!enrollment) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Data enrollment tidak ditemukan');
    }

    // 2. Run Generators in Parallel
    const [raportMerdeka, raporPesantren] = await Promise.all([
      RaportMerdekaService.generateRaportMerdeka(studentId, academicYearId, semester),
      generateRaporPesantren({ studentId, academicYearId, semester, unitId: student.unitId })
    ]);

    // 3. Structure the Unified Data
    // This structure is designed to be easily consumed by a PDF generator or Frontend View
    return {
      meta: {
        generatedAt: new Date(),
        semester,
        academicYear: raportMerdeka.tahunAjaran.tahun,
        formatVersion: '1.0.0',
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
        // From Raport Merdeka
        intrakurikuler: raportMerdeka.intrakurikuler,
        p5: raportMerdeka.projekP5,
        extracurricular: raportMerdeka.ekstrakurikuler,
        attendance: raportMerdeka.kehadiran,
      },
      islamic: {
        // From Rapor Pesantren
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
      },
      signatures: {
        homeroomTeacher: enrollment.class.homeroomTeacher?.user.name,
        principal: 'Kepala Sekolah', // Should be fetched from Unit/Staff structure
        guardian: 'Orang Tua / Wali',
        date: new Date(),
      }
    };
  }

  /**
   * Get formatted Unified Raport for print
   */
  static async getPrintData(studentId: string, academicYearId: string, semester: number) {
    const data = await this.generateUnifiedRaport(studentId, academicYearId, semester);

    // Add layout configuration or specific print formatting logic here if needed
    return {
      ...data,
      layout: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      }
    };
  }
}
