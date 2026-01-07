import { prisma } from '@/lib/prisma';
import { Errors } from '@/middleware/error';
import { UserRole, Gender, UnitType } from '@prisma/client';

// User type from JwtPayload
interface AuthenticatedUser {
  sub: string;
  role: UserRole;
  unitId: string | null;
}

interface DapodikExportOptions {
  unitId?: string;
  academicYearId?: string;
  includeInactive?: boolean;
}

// ============================================
// DAPODIK STUDENT DATA FORMAT (Kemendikbud)
// ============================================

interface DapodikStudentData {
  no: number;
  nisn: string;
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  agama: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  namaAyah: string;
  nikAyah: string;
  pekerjaanAyah: string;
  namaIbu: string;
  nikIbu: string;
  pekerjaanIbu: string;
  noTelepon: string;
  email: string;
  tingkat: string;
  rombelId: string;
  rombelNama: string;
  jurusan: string;
  tahunMasuk: number | null;
  statusPesertaDidik: string;
  jenisKeluar: string | null;
  tanggalKeluar: string | null;
}

// ============================================
// DAPODIK TEACHER DATA FORMAT (Kemendikbud)
// ============================================

interface DapodikTeacherData {
  no: number;
  nuptk: string;
  nip: string;
  nik: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  agama: string;
  alamat: string;
  kabupaten: string;
  provinsi: string;
  noTelepon: string;
  email: string;
  statusKepegawaian: string;
  jenisPtk: string;
  tugasUtama: string;
  pendidikanTerakhir: string;
  bidangStudi: string;
  sertifikasiPendidik: boolean;
  tanggalMasuk: string;
  tmtPegawai: string | null;
  masaKerja: number;
}

// ============================================
// DAPODIK SCHOOL PROFILE FORMAT
// ============================================

interface DapodikSekolahData {
  npsn: string;
  namaSekolah: string;
  bentukPendidikan: string;
  statusSekolah: 'Negeri' | 'Swasta';
  alamat: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  lintang: string;
  bujur: string;
  noTelepon: string;
  noFax: string;
  email: string;
  website: string;
  akreditasi: string;
  waktuPenyelenggaraan: string;
  namaYayasan: string;
  skPendirian: string;
  tanggalSkPendirian: string;
  statusKepemilikan: string;
  luasTanah: number;
  jumlahSiswa: number;
  jumlahRombel: number;
  jumlahGuru: number;
  jumlahTendik: number;
}

// ============================================
// DAPODIK ROMBEL/CLASS DATA FORMAT
// ============================================

interface DapodikRombelData {
  rombelId: string;
  namaRombel: string;
  tingkat: string;
  kurikulum: string;
  waliKelas: string;
  nuptkWali: string;
  jumlahSiswa: number;
  siswaLaki: number;
  siswaPerempuan: number;
}

// ============================================
// SERVICE CLASS
// ============================================

class DapodikService {
  // Export student data in Dapodik format
  async exportStudentData(
    options: DapodikExportOptions,
    currentUser: AuthenticatedUser
  ): Promise<DapodikStudentData[]> {
    // Validate unit access
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      throw Errors.forbidden('Tidak memiliki akses export Dapodik');
    }

    const unitId = options.unitId || currentUser.unitId;
    if (!unitId) {
      throw Errors.badRequest('Unit ID wajib diisi');
    }

    const students = await prisma.student.findMany({
      where: {
        unitId,
        isActive: options.includeInactive ? undefined : true,
      },
      include: {
        currentClass: true,
        parent: {
          include: {
            user: true,
          },
        },
        studentEnrollments: {
          where: options.academicYearId
            ? { academicYearId: options.academicYearId }
            : undefined,
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ currentClass: { name: 'asc' } }, { name: 'asc' }],
    });

    return students.map((student, index) => ({
      no: index + 1,
      nisn: student.nisn || '',
      nik: student.nik || '',
      namaLengkap: student.name,
      tempatLahir: student.birthPlace || '',
      tanggalLahir: student.birthDate ? this.formatDate(student.birthDate) : '',
      jenisKelamin: student.gender === Gender.MALE ? 'L' : 'P',
      agama: 'Islam',
      alamat: student.address || '',
      rt: '',
      rw: '',
      kelurahan: '',
      kecamatan: '',
      kabupaten: '',
      provinsi: '',
      kodePos: '',
      namaAyah: student.parent?.fatherName || '',
      nikAyah: '',
      pekerjaanAyah: student.parent?.fatherOccupation || '',
      namaIbu: student.parent?.motherName || '',
      nikIbu: '',
      pekerjaanIbu: student.parent?.motherOccupation || '',
      noTelepon: student.parent?.user?.phone || '',
      email: student.parent?.user?.email || '',
      tingkat: student.currentClass?.level?.toString() || '',
      rombelId: student.currentClassId || '',
      rombelNama: student.currentClass?.name || '',
      jurusan: '',
      tahunMasuk: student.entryYear,
      statusPesertaDidik: student.isActive ? 'Aktif' : 'Keluar',
      jenisKeluar: student.isActive ? null : 'Mutasi',
      tanggalKeluar: null,
    }));
  }

  // Export teacher data in Dapodik format
  async exportTeacherData(
    options: DapodikExportOptions,
    currentUser: AuthenticatedUser
  ): Promise<DapodikTeacherData[]> {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      throw Errors.forbidden('Tidak memiliki akses export Dapodik');
    }

    const unitId = options.unitId || currentUser.unitId;
    if (!unitId) {
      throw Errors.badRequest('Unit ID wajib diisi');
    }

    const employees = await prisma.employee.findMany({
      where: {
        unitId,
        isActive: options.includeInactive ? undefined : true,
        OR: [
          { position: { contains: 'Guru' } },
          { position: { contains: 'guru' } },
          { position: { contains: 'Pengajar' } },
        ],
      },
      include: {
        user: true,
      },
      orderBy: { user: { name: 'asc' } },
    });

    const startDate = new Date();

    return employees.map((emp, index) => ({
      no: index + 1,
      nuptk: emp.nuptk || '',
      nip: emp.nip || '',
      nik: emp.nik || '',
      namaLengkap: emp.user?.name || '',
      tempatLahir: emp.birthPlace || '',
      tanggalLahir: emp.birthDate ? this.formatDate(emp.birthDate) : '',
      jenisKelamin: emp.gender === Gender.MALE ? 'L' : 'P',
      agama: 'Islam',
      alamat: emp.address || '',
      kabupaten: '',
      provinsi: '',
      noTelepon: emp.phone || emp.user?.phone || '',
      email: emp.user?.email || '',
      statusKepegawaian: emp.employmentStatus || 'GTY',
      jenisPtk: 'Guru',
      tugasUtama: emp.position || '',
      pendidikanTerakhir: emp.education || 'S1',
      bidangStudi: emp.specialization || '',
      sertifikasiPendidik: emp.certification ? true : false,
      tanggalMasuk: emp.joinDate ? this.formatDate(emp.joinDate) : '',
      tmtPegawai: null,
      masaKerja: emp.joinDate
        ? Math.floor((startDate.getTime() - emp.joinDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0,
    }));
  }

  // Export rombel/class data
  async exportRombelData(
    options: DapodikExportOptions,
    currentUser: AuthenticatedUser
  ): Promise<DapodikRombelData[]> {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      throw Errors.forbidden('Tidak memiliki akses export Dapodik');
    }

    const unitId = options.unitId || currentUser.unitId;
    if (!unitId) {
      throw Errors.badRequest('Unit ID wajib diisi');
    }

    const classes = await prisma.class.findMany({
      where: {
        unitId,
        academicYearId: options.academicYearId || undefined,
      },
      include: {
        homeroomTeacher: {
          include: {
            user: true,
            employee: true,
          },
        },
        _count: {
          select: { students: true },
        },
        students: {
          select: { gender: true },
        },
      },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return classes.map((cls) => ({
      rombelId: cls.id,
      namaRombel: cls.name,
      tingkat: cls.level?.toString() || '',
      kurikulum: 'Kurikulum Merdeka',
      waliKelas: cls.homeroomTeacher?.user?.name || '',
      nuptkWali: cls.homeroomTeacher?.employee?.nuptk || '',
      jumlahSiswa: cls._count.students,
      siswaLaki: cls.students.filter((s) => s.gender === Gender.MALE).length,
      siswaPerempuan: cls.students.filter((s) => s.gender === Gender.FEMALE).length,
    }));
  }

  // Export school profile data
  async exportSekolahData(
    unitId: string,
    currentUser: AuthenticatedUser
  ): Promise<DapodikSekolahData> {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      throw Errors.forbidden('Tidak memiliki akses export Dapodik');
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        _count: {
          select: {
            students: { where: { isActive: true } },
            classes: true,
            employees: { where: { isActive: true } },
          },
        },
      },
    });

    if (!unit) {
      throw Errors.notFound('Unit tidak ditemukan');
    }

    // Get teacher count
    const teacherCount = await prisma.employee.count({
      where: {
        unitId,
        isActive: true,
        OR: [{ position: { contains: 'Guru' } }, { position: { contains: 'guru' } }],
      },
    });

    return {
      npsn: unit.npsn || '',
      namaSekolah: unit.name,
      bentukPendidikan: this.mapUnitTypeToDapodik(unit.type),
      statusSekolah: 'Swasta',
      alamat: unit.address || '',
      kelurahan: '',
      kecamatan: '',
      kabupaten: '',
      provinsi: '',
      kodePos: '',
      lintang: '',
      bujur: '',
      noTelepon: unit.phone || '',
      noFax: '',
      email: unit.email || '',
      website: '',
      akreditasi: unit.accreditation || '',
      waktuPenyelenggaraan: 'Pagi',
      namaYayasan: 'Yayasan Cipansor',
      skPendirian: '',
      tanggalSkPendirian: '',
      statusKepemilikan: 'Yayasan',
      luasTanah: 0,
      jumlahSiswa: unit._count.students,
      jumlahRombel: unit._count.classes,
      jumlahGuru: teacherCount,
      jumlahTendik: unit._count.employees - teacherCount,
    };
  }

  // Get export summary for validation
  async getExportSummary(unitId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      throw Errors.forbidden('Tidak memiliki akses');
    }

    const [studentCount, teacherCount, classCount] = await Promise.all([
      prisma.student.count({ where: { unitId, isActive: true } }),
      prisma.employee.count({
        where: {
          unitId,
          isActive: true,
          OR: [{ position: { contains: 'Guru' } }],
        },
      }),
      prisma.class.count({ where: { unitId } }),
    ]);

    // Check NISN completeness
    const studentsWithNisn = await prisma.student.count({
      where: { unitId, isActive: true, nisn: { not: null } },
    });

    // Check NUPTK completeness
    const teachersWithNuptk = await prisma.employee.count({
      where: {
        unitId,
        isActive: true,
        nuptk: { not: null },
        OR: [{ position: { contains: 'Guru' } }],
      },
    });

    const nisnRate = studentCount > 0 ? (studentsWithNisn / studentCount) * 100 : 0;
    const nuptkRate = teacherCount > 0 ? (teachersWithNuptk / teacherCount) * 100 : 0;

    return {
      students: {
        total: studentCount,
        withNisn: studentsWithNisn,
        completeness: Math.round(nisnRate),
      },
      teachers: {
        total: teacherCount,
        withNuptk: teachersWithNuptk,
        completeness: Math.round(nuptkRate),
      },
      classes: classCount,
      readiness: this.calculateReadinessScore({ nisnRate, nuptkRate }),
    };
  }

  // Validate data before export
  async validateData(unitId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'UNIT_ADMIN') {
      throw Errors.forbidden('Tidak memiliki akses');
    }

    const issues: { type: string; severity: 'error' | 'warning'; message: string; count: number }[] = [];

    // Check students without NISN
    const studentsWithoutNisn = await prisma.student.count({
      where: { unitId, isActive: true, OR: [{ nisn: null }, { nisn: '' }] },
    });
    if (studentsWithoutNisn > 0) {
      issues.push({
        type: 'MISSING_NISN',
        severity: 'error',
        message: `${studentsWithoutNisn} siswa belum memiliki NISN`,
        count: studentsWithoutNisn,
      });
    }

    // Check teachers without NUPTK
    const teachersWithoutNuptk = await prisma.employee.count({
      where: {
        unitId,
        isActive: true,
        OR: [{ nuptk: null }, { nuptk: '' }],
        position: { contains: 'Guru' },
      },
    });
    if (teachersWithoutNuptk > 0) {
      issues.push({
        type: 'MISSING_NUPTK',
        severity: 'warning',
        message: `${teachersWithoutNuptk} guru belum memiliki NUPTK`,
        count: teachersWithoutNuptk,
      });
    }

    // Check students without NIK
    const studentsWithoutNik = await prisma.student.count({
      where: { unitId, isActive: true, OR: [{ nik: null }, { nik: '' }] },
    });
    if (studentsWithoutNik > 0) {
      issues.push({
        type: 'MISSING_NIK',
        severity: 'warning',
        message: `${studentsWithoutNik} siswa belum memiliki NIK`,
        count: studentsWithoutNik,
      });
    }

    return {
      isValid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
      totalErrors: issues.filter((i) => i.severity === 'error').length,
      totalWarnings: issues.filter((i) => i.severity === 'warning').length,
    };
  }

  // Helper functions
  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private mapUnitTypeToDapodik(type: UnitType): string {
    const map: Record<UnitType, string> = {
      PAUD: 'PAUD',
      TK: 'TK',
      SD: 'SD',
      SMP: 'SMP',
      SMA: 'SMA',
      SMK: 'SMK',
      MA: 'MA',
      MTS: 'MTs',
      MI: 'MI',
      PESANTREN: 'Pondok Pesantren',
      YAYASAN: 'Yayasan',
    };
    return map[type] || type;
  }

  private calculateReadinessScore(data: { nisnRate: number; nuptkRate: number }): number {
    return Math.round((data.nisnRate * 0.6 + data.nuptkRate * 0.4));
  }
}

export const dapodikService = new DapodikService();
