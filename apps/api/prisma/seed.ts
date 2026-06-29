import {
  UserRole,
  UnitType,
  Gender,
  AttendanceStatus,
  TahfidzActivityType,
  PermitType,
  PermitStatus,
  ViolationType,
  PaymentStatus,
  PaymentMethod,
  AdmissionStatus,
  LeaveType,
  LeaveStatus,
  StaffAttendanceStatus,
  BookStatus,
  BorrowingStatus,
  MedicalRecordType,
  NotificationType,
  NotificationStatus,
  AssetStatus,
  AssetCondition,
  SubjectType,
  DayOfWeek,
  ExamType,
  ExamStatus,
  GradeType,
  AlumniStatus,
  DonationType,
  AlumniEventType,
  Prisma,
  Realm,
} from '@prisma/client';
import { createPrismaClient } from './client';
import bcrypt from 'bcryptjs';
import { seedWilayahIndonesia } from './seeds/wilayah-indonesia';
import { seedKurikulumMerdeka, seedAccountCodes } from './seeds/kurikulum-merdeka';
import { seedPAUDIndicators } from './seeds/paud-indicators';
import { seedImmunizationReference } from './seeds/immunization-reference';
import { PERMISSIONS } from '../src/modules/roles/permissions';

// RoleCode - All possible role codes in the system
const RoleCode = {
  // Global
  SUPER_ADMIN: 'SUPER_ADMIN',

  // Yayasan roles
  YAYASAN_ADMIN: 'YAYASAN_ADMIN',
  YAYASAN_PEMBINA: 'YAYASAN_PEMBINA',
  YAYASAN_KETUA: 'YAYASAN_KETUA',
  YAYASAN_SEKRETARIS: 'YAYASAN_SEKRETARIS',
  YAYASAN_BENDAHARA: 'YAYASAN_BENDAHARA',
  YAYASAN_ANGGOTA: 'YAYASAN_ANGGOTA',
  YAYASAN_PENGAWAS: 'YAYASAN_PENGAWAS',

  // TK Qur'an roles
  TKQ_ADMIN: 'TKQ_ADMIN',
  TKQ_KEPALA_SEKOLAH: 'TKQ_KEPALA_SEKOLAH',
  TKQ_GURU: 'TKQ_GURU',
  TKQ_TATA_USAHA: 'TKQ_TATA_USAHA',
  TKQ_ORANG_TUA: 'TKQ_ORANG_TUA',
  TKQ_SISWA: 'TKQ_SISWA',

  // SD IT (Islam Terpadu) roles
  SDIT_ADMIN: 'SDIT_ADMIN',
  SDIT_KEPALA_SEKOLAH: 'SDIT_KEPALA_SEKOLAH',
  SDIT_GURU: 'SDIT_GURU',
  SDIT_TATA_USAHA: 'SDIT_TATA_USAHA',
  SDIT_ORANG_TUA: 'SDIT_ORANG_TUA',
  SDIT_SISWA: 'SDIT_SISWA',

  // SMP IT (Islam Terpadu) roles
  SMPIT_ADMIN: 'SMPIT_ADMIN',
  SMPIT_KEPALA_SEKOLAH: 'SMPIT_KEPALA_SEKOLAH',
  SMPIT_GURU: 'SMPIT_GURU',
  SMPIT_TATA_USAHA: 'SMPIT_TATA_USAHA',
  SMPIT_ORANG_TUA: 'SMPIT_ORANG_TUA',
  SMPIT_SISWA: 'SMPIT_SISWA',

  // SMA Qur'an roles
  SMAQ_ADMIN: 'SMAQ_ADMIN',
  SMAQ_KEPALA_SEKOLAH: 'SMAQ_KEPALA_SEKOLAH',
  SMAQ_GURU: 'SMAQ_GURU',
  SMAQ_TATA_USAHA: 'SMAQ_TATA_USAHA',
  SMAQ_ORANG_TUA: 'SMAQ_ORANG_TUA',
  SMAQ_SISWA: 'SMAQ_SISWA',

  // Pesantren roles (cross-unit)
  MUSYRIF: 'MUSYRIF', // Pembina asrama
  MUHAFIDZ: 'MUHAFIDZ', // Pengampu tahfidz
  MURABBI: 'MURABBI', // Pembina akhlaq
  WALI_KAMAR: 'WALI_KAMAR', // Penanggung jawab kamar
} as const;

// Define System User ID constant
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

const prisma = createPrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // PHASE 8: Wilayah Indonesia & Kurikulum Merdeka
  // ============================================
  await seedWilayahIndonesia(prisma);
  await seedAccountCodes(prisma);

  // Clean up existing data.
  // Previously this was a long, hand-ordered list of deleteMany() calls that had
  // to mirror every FK dependency. It drifted out of sync with the schema (e.g.
  // LearningOutcome/MerdekaAssessment/QuestionBank/Assignment all reference
  // Subject but were never deleted before it), making re-seeds fail on FK
  // violations. Truncating every table with CASCADE can't drift and is exactly
  // what a re-seed wants. _prisma_migrations is preserved.
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length > 0) {
    const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
    );
  }


  // ============================================
  // SYSTEM USER
  // ============================================
  await prisma.user.create({
    data: {
      id: SYSTEM_USER_ID,
      name: 'SYSTEM',
      email: 'system@cipansor.id',
      passwordHash: await bcrypt.hash('System123!', 10),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log('✅ System user created');

  // ============================================
  // PHASE 3: Foundation / Yayasan
  // ============================================

  const foundation = await prisma.foundation.create({
    data: {
      name: 'Yayasan Pesantren Cipansor',
      legalName: 'Yayasan Pendidikan Islam Cipansor',
      foundingDate: new Date('1985-08-17'),
      taxId: '01.234.567.8-901.000',
      address: 'Jl. Cipansor No. 1, Kec. Sukabumi, Kota Sukabumi, Jawa Barat',
      phone: '0266100001',
      email: 'yayasan@cipansor.id',
      website: 'https://cipansor.id',
      vision:
        'Menjadi lembaga pendidikan Islam terdepan yang menghasilkan generasi Qurani berakhlak mulia',
      mission:
        'Menyelenggarakan pendidikan Islam terpadu, membentuk karakter Islami, dan mengembangkan potensi santri secara optimal',
    },
  });

  console.log('✅ Foundation created');

  // Create Board Members
  const boardMembersData = [
    {
      name: 'KH. Muhammad Yusuf',
      position: 'Ketua',
      phone: '081234567890',
      email: 'ketua@cipansor.id',
    },
    {
      name: 'H. Ahmad Fauzi',
      position: 'Wakil Ketua',
      phone: '081234567891',
      email: 'wakil@cipansor.id',
    },
    {
      name: 'Hj. Siti Fatimah',
      position: 'Sekretaris',
      phone: '081234567892',
      email: 'sekretaris@cipansor.id',
    },
    {
      name: 'H. Abdullah Rahman',
      position: 'Bendahara',
      phone: '081234567893',
      email: 'bendahara@cipansor.id',
    },
    {
      name: 'Ustadz Hasan Basri',
      position: 'Anggota',
      phone: '081234567894',
      email: 'anggota1@cipansor.id',
    },
  ];

  for (const member of boardMembersData) {
    await prisma.boardMember.create({
      data: {
        foundationId: foundation.id,
        name: member.name,
        position: member.position,
        phone: member.phone,
        email: member.email,
        startDate: new Date('2020-01-01'),
        isActive: true,
      },
    });
  }

  console.log('✅ Board members created');

  // Create Units
  const pesantren = await prisma.unit.create({
    data: {
      foundationId: foundation.id,
      name: 'SMP IT Al-Hikmah',
      type: UnitType.SMP_IT,
      address: 'Jl. Pesantren No. 1, Kota Sukabumi',
      phone: '0266123456',
      email: 'info@smpit.sch.id',
    },
  });

  const sdIt = await prisma.unit.create({
    data: {
      foundationId: foundation.id,
      name: 'SD IT Ar-Rahman',
      type: UnitType.SD_IT,
      address: 'Jl. Pendidikan No. 10, Kota Sukabumi',
      phone: '0266789012',
      email: 'info@sdit.sch.id',
    },
  });

  const tkQuran = await prisma.unit.create({
    data: {
      foundationId: foundation.id,
      name: "TK Qur'an Cipansor",
      type: UnitType.TK_QURAN,
      address: "Jl. TK Qur'an No. 5, Kota Sukabumi",
      phone: '0266345678',
      email: 'info@tkquran.sch.id',
    },
  });

  const smaQuran = await prisma.unit.create({
    data: {
      foundationId: foundation.id,
      name: "SMA Qur'an Cipansor",
      type: UnitType.SMA_QURAN,
      address: "Jl. Al-Qur'an No. 1, Kota Sukabumi",
      phone: '0266456789',
      email: 'info@smaquran.sch.id',
    },
  });

  console.log('✅ Units created');

  // ============================================
  // SEED ROLES - All possible roles in the system
  // ============================================

  const rolesData = [
    // Global
    {
      code: RoleCode.SUPER_ADMIN,
      name: 'Super Admin',
      realm: Realm.GLOBAL,
      description: 'Full access to entire system',
      permissions: Object.values(PERMISSIONS),
    },

    // Yayasan roles
    {
      code: RoleCode.YAYASAN_ADMIN,
      name: 'Admin Yayasan',
      realm: Realm.YAYASAN,
      description: 'Administrator yayasan',
    },
    {
      code: RoleCode.YAYASAN_PEMBINA,
      name: 'Pembina',
      realm: Realm.YAYASAN,
      description: 'Pembina yayasan',
    },
    {
      code: RoleCode.YAYASAN_KETUA,
      name: 'Ketua Pengurus',
      realm: Realm.YAYASAN,
      description: 'Ketua pengurus yayasan',
    },
    {
      code: RoleCode.YAYASAN_SEKRETARIS,
      name: 'Sekretaris',
      realm: Realm.YAYASAN,
      description: 'Sekretaris pengurus yayasan',
    },
    {
      code: RoleCode.YAYASAN_BENDAHARA,
      name: 'Bendahara',
      realm: Realm.YAYASAN,
      description: 'Bendahara pengurus yayasan',
    },
    {
      code: RoleCode.YAYASAN_ANGGOTA,
      name: 'Anggota Pengurus',
      realm: Realm.YAYASAN,
      description: 'Anggota pengurus yayasan',
    },
    {
      code: RoleCode.YAYASAN_PENGAWAS,
      name: 'Pengawas',
      realm: Realm.YAYASAN,
      description: 'Pengawas yayasan',
    },

    // TK Qur'an roles
    {
      code: RoleCode.TKQ_ADMIN,
      name: "Admin TK Qur'an",
      realm: Realm.TK_QURAN,
      description: "Administrator TK Qur'an",
    },
    {
      code: RoleCode.TKQ_KEPALA_SEKOLAH,
      name: "Kepala TK Qur'an",
      realm: Realm.TK_QURAN,
      description: "Kepala sekolah TK Qur'an",
    },
    {
      code: RoleCode.TKQ_GURU,
      name: "Guru TK Qur'an",
      realm: Realm.TK_QURAN,
      description: "Guru TK Qur'an",
    },
    {
      code: RoleCode.TKQ_TATA_USAHA,
      name: "Tata Usaha TK Qur'an",
      realm: Realm.TK_QURAN,
      description: "Tata usaha TK Qur'an",
    },
    {
      code: RoleCode.TKQ_ORANG_TUA,
      name: "Orang Tua TK Qur'an",
      realm: Realm.TK_QURAN,
      description: "Orang tua siswa TK Qur'an",
    },
    {
      code: RoleCode.TKQ_SISWA,
      name: "Siswa TK Qur'an",
      realm: Realm.TK_QURAN,
      description: "Siswa TK Qur'an",
    },

    // SD IT (Islam Terpadu) roles
    {
      code: RoleCode.SDIT_ADMIN,
      name: 'Admin SD IT',
      realm: Realm.SD_IT,
      description: 'Administrator SD IT',
    },
    {
      code: RoleCode.SDIT_KEPALA_SEKOLAH,
      name: 'Kepala SD IT',
      realm: Realm.SD_IT,
      description: 'Kepala sekolah SD IT',
    },
    { code: RoleCode.SDIT_GURU, name: 'Guru SD IT', realm: Realm.SD_IT, description: 'Guru SD IT' },
    {
      code: RoleCode.SDIT_TATA_USAHA,
      name: 'Tata Usaha SD IT',
      realm: Realm.SD_IT,
      description: 'Tata usaha SD IT',
    },
    {
      code: RoleCode.SDIT_ORANG_TUA,
      name: 'Orang Tua SD IT',
      realm: Realm.SD_IT,
      description: 'Orang tua siswa SD IT',
    },
    {
      code: RoleCode.SDIT_SISWA,
      name: 'Siswa SD IT',
      realm: Realm.SD_IT,
      description: 'Siswa SD IT',
    },

    // SMP IT (Islam Terpadu) roles
    {
      code: RoleCode.SMPIT_ADMIN,
      name: 'Admin SMP IT',
      realm: Realm.SMP_IT,
      description: 'Administrator SMP IT',
    },
    {
      code: RoleCode.SMPIT_KEPALA_SEKOLAH,
      name: 'Kepala SMP IT',
      realm: Realm.SMP_IT,
      description: 'Kepala sekolah SMP IT',
    },
    {
      code: RoleCode.SMPIT_GURU,
      name: 'Guru SMP IT',
      realm: Realm.SMP_IT,
      description: 'Guru SMP IT',
    },
    {
      code: RoleCode.SMPIT_TATA_USAHA,
      name: 'Tata Usaha SMP IT',
      realm: Realm.SMP_IT,
      description: 'Tata usaha SMP IT',
    },
    {
      code: RoleCode.SMPIT_ORANG_TUA,
      name: 'Orang Tua SMP IT',
      realm: Realm.SMP_IT,
      description: 'Orang tua siswa SMP IT',
    },
    {
      code: RoleCode.SMPIT_SISWA,
      name: 'Siswa SMP IT',
      realm: Realm.SMP_IT,
      description: 'Siswa SMP IT',
    },

    // SMA Qur'an roles
    {
      code: RoleCode.SMAQ_ADMIN,
      name: "Admin SMA Qur'an",
      realm: Realm.SMA_QURAN,
      description: "Administrator SMA Qur'an",
    },
    {
      code: RoleCode.SMAQ_KEPALA_SEKOLAH,
      name: "Kepala SMA Qur'an",
      realm: Realm.SMA_QURAN,
      description: "Kepala sekolah SMA Qur'an",
    },
    {
      code: RoleCode.SMAQ_GURU,
      name: "Guru SMA Qur'an",
      realm: Realm.SMA_QURAN,
      description: "Guru SMA Qur'an",
    },
    {
      code: RoleCode.SMAQ_TATA_USAHA,
      name: "Tata Usaha SMA Qur'an",
      realm: Realm.SMA_QURAN,
      description: "Tata usaha SMA Qur'an",
    },
    {
      code: RoleCode.SMAQ_ORANG_TUA,
      name: "Orang Tua SMA Qur'an",
      realm: Realm.SMA_QURAN,
      description: "Orang tua siswa SMA Qur'an",
    },
    {
      code: RoleCode.SMAQ_SISWA,
      name: "Siswa SMA Qur'an",
      realm: Realm.SMA_QURAN,
      description: "Siswa SMA Qur'an",
    },

    // Pesantren roles (cross-unit)
    {
      code: RoleCode.MUSYRIF,
      name: 'Musyrif',
      realm: Realm.PESANTREN,
      description: 'Pembina asrama',
    },
    {
      code: RoleCode.MUHAFIDZ,
      name: 'Muhafidz',
      realm: Realm.PESANTREN,
      description: 'Pengampu tahfidz',
    },
    {
      code: RoleCode.MURABBI,
      name: 'Murabbi',
      realm: Realm.PESANTREN,
      description: 'Pembina akhlaq',
    },
    {
      code: RoleCode.WALI_KAMAR,
      name: 'Wali Kamar',
      realm: Realm.PESANTREN,
      description: 'Penanggung jawab kamar',
    },
  ];

  const roles: Record<string, any> = {};
  for (const roleData of rolesData) {
    const role = await prisma.role.create({ data: roleData });
    roles[roleData.code] = role;
  }

  console.log('✅ Roles created');

  // Create Super Admin with role assignment
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@cipansor.id',
      passwordHash: await bcrypt.hash('SuperAdmin123!', 10),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: superAdminUser.id,
      roleId: roles[RoleCode.SUPER_ADMIN].id,
      isPrimary: true,
      isActive: true,
    },
  });

  // Create Yayasan Users with multiple roles
  const ketuaYayasanUser = await prisma.user.create({
    data: {
      name: 'KH. Muhammad Yusuf',
      email: 'ketua@cipansor.id',
      passwordHash: await bcrypt.hash('Ketua123!', 10),
      role: UserRole.STAFF,
      isActive: true,
    },
  });

  // Ketua Yayasan has multiple roles
  await prisma.userRoleAssignment.createMany({
    data: [
      {
        userId: ketuaYayasanUser.id,
        roleId: roles[RoleCode.YAYASAN_KETUA].id,
        isPrimary: true,
        isActive: true,
      },
      {
        userId: ketuaYayasanUser.id,
        roleId: roles[RoleCode.YAYASAN_PEMBINA].id,
        isPrimary: false,
        isActive: true,
      },
    ],
  });

  const sekretarisYayasanUser = await prisma.user.create({
    data: {
      name: 'Hj. Siti Fatimah',
      email: 'sekretaris@cipansor.id',
      passwordHash: await bcrypt.hash('Sekretaris123!', 10),
      role: UserRole.STAFF,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: sekretarisYayasanUser.id,
      roleId: roles[RoleCode.YAYASAN_SEKRETARIS].id,
      isPrimary: true,
      isActive: true,
    },
  });

  const bendaharaYayasanUser = await prisma.user.create({
    data: {
      name: 'H. Abdullah Rahman',
      email: 'bendahara@cipansor.id',
      passwordHash: await bcrypt.hash('Bendahara123!', 10),
      role: UserRole.STAFF,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: bendaharaYayasanUser.id,
      roleId: roles[RoleCode.YAYASAN_BENDAHARA].id,
      isPrimary: true,
      isActive: true,
    },
  });

  // Admin Yayasan
  const adminYayasanUser = await prisma.user.create({
    data: {
      name: 'Admin Yayasan',
      email: 'admin.yayasan@cipansor.id',
      passwordHash: await bcrypt.hash('AdminYayasan123!', 10),
      role: UserRole.UNIT_ADMIN,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: adminYayasanUser.id,
      roleId: roles[RoleCode.YAYASAN_ADMIN].id,
      isPrimary: true,
      isActive: true,
    },
  });

  // Create Unit Admins with role assignments
  const adminPesantrenUser = await prisma.user.create({
    data: {
      name: 'Admin SMP IT',
      email: 'admin@smpit.sch.id',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: UserRole.UNIT_ADMIN,
      unitId: pesantren.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: adminPesantrenUser.id,
      roleId: roles[RoleCode.SMPIT_ADMIN].id,
      unitId: pesantren.id,
      isPrimary: true,
      isActive: true,
    },
  });

  const adminSdItUser = await prisma.user.create({
    data: {
      name: 'Admin SD IT',
      email: 'admin@sdit.sch.id',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: UserRole.UNIT_ADMIN,
      unitId: sdIt.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: adminSdItUser.id,
      roleId: roles[RoleCode.SDIT_ADMIN].id,
      unitId: sdIt.id,
      isPrimary: true,
      isActive: true,
    },
  });

  // Kepala Sekolah SMP IT (also has Guru role)
  const kepalaSmpItUser = await prisma.user.create({
    data: {
      name: 'Drs. H. Sulaiman, M.Pd',
      email: 'kepala@smpit.sch.id',
      passwordHash: await bcrypt.hash('Kepala123!', 10),
      role: UserRole.TEACHER,
      unitId: pesantren.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.createMany({
    data: [
      {
        userId: kepalaSmpItUser.id,
        roleId: roles[RoleCode.SMPIT_KEPALA_SEKOLAH].id,
        unitId: pesantren.id,
        isPrimary: true,
        isActive: true,
      },
      {
        userId: kepalaSmpItUser.id,
        roleId: roles[RoleCode.SMPIT_GURU].id,
        unitId: pesantren.id,
        isPrimary: false,
        isActive: true,
      },
    ],
  });

  // Kepala Sekolah SD IT
  const kepalaSdItUser = await prisma.user.create({
    data: {
      name: 'Hj. Aminah, S.Pd',
      email: 'kepala@sdit.sch.id',
      passwordHash: await bcrypt.hash('Kepala123!', 10),
      role: UserRole.TEACHER,
      unitId: sdIt.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.createMany({
    data: [
      {
        userId: kepalaSdItUser.id,
        roleId: roles[RoleCode.SDIT_KEPALA_SEKOLAH].id,
        unitId: sdIt.id,
        isPrimary: true,
        isActive: true,
      },
      {
        userId: kepalaSdItUser.id,
        roleId: roles[RoleCode.SDIT_GURU].id,
        unitId: sdIt.id,
        isPrimary: false,
        isActive: true,
      },
    ],
  });

  // Create Teachers (User + Teacher profile) with role assignments
  const teacherPesantrenUser = await prisma.user.create({
    data: {
      name: 'Ustadz Ahmad',
      email: 'ahmad@smpit.sch.id',
      passwordHash: await bcrypt.hash('Teacher123!', 10),
      role: UserRole.TEACHER,
      unitId: pesantren.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: teacherPesantrenUser.id,
      roleId: roles[RoleCode.SMPIT_GURU].id,
      unitId: pesantren.id,
      isPrimary: true,
      isActive: true,
    },
  });

  const teacherPesantren = await prisma.teacher.create({
    data: {
      userId: teacherPesantrenUser.id,
      unitId: pesantren.id,
      nip: '198501012010011001',
    },
  });

  const teacherSdItUser = await prisma.user.create({
    data: {
      name: 'Ibu Fatimah',
      email: 'fatimah@sdit.sch.id',
      passwordHash: await bcrypt.hash('Teacher123!', 10),
      role: UserRole.TEACHER,
      unitId: sdIt.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: teacherSdItUser.id,
      roleId: roles[RoleCode.SDIT_GURU].id,
      unitId: sdIt.id,
      isPrimary: true,
      isActive: true,
    },
  });

  const teacherSdIt = await prisma.teacher.create({
    data: {
      userId: teacherSdItUser.id,
      unitId: sdIt.id,
      nip: '198601022012012002',
    },
  });

  // Create Tata Usaha for SMP IT
  const tuSmpItUser = await prisma.user.create({
    data: {
      name: 'Bpk. Bambang',
      email: 'tu@smpit.sch.id',
      passwordHash: await bcrypt.hash('TataUsaha123!', 10),
      role: UserRole.STAFF,
      unitId: pesantren.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: tuSmpItUser.id,
      roleId: roles[RoleCode.SMPIT_TATA_USAHA].id,
      unitId: pesantren.id,
      isPrimary: true,
      isActive: true,
    },
  });

  // Create Tata Usaha for SD IT
  const tuSdItUser = await prisma.user.create({
    data: {
      name: 'Ibu Sari',
      email: 'tu@sdit.sch.id',
      passwordHash: await bcrypt.hash('TataUsaha123!', 10),
      role: UserRole.STAFF,
      unitId: sdIt.id,
      isActive: true,
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: tuSdItUser.id,
      roleId: roles[RoleCode.SDIT_TATA_USAHA].id,
      unitId: sdIt.id,
      isPrimary: true,
      isActive: true,
    },
  });

  console.log('✅ Users and Teachers created');

  // Create Academic Years (global, not per unit)
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024/2025',
      isActive: true,
      startDate: new Date('2024-07-15'),
      endDate: new Date('2025-06-30'),
    },
  });

  console.log('✅ Academic year created');

  // Create Classes
  const class7A = await prisma.class.create({
    data: {
      unitId: pesantren.id,
      academicYearId: academicYear.id,
      name: '7A',
      level: '7',
      capacity: 30,
      homeroomTeacherId: teacherPesantren.id,
    },
  });

  const class1A = await prisma.class.create({
    data: {
      unitId: sdIt.id,
      academicYearId: academicYear.id,
      name: '1A',
      level: '1',
      capacity: 25,
      homeroomTeacherId: teacherSdIt.id,
    },
  });

  console.log('✅ Classes created');

  // Create Students
  const students = [];

  // Assign students to different units/realms
  const studentConfigs = [
    {
      name: 'Muhammad Rizky',
      gender: Gender.MALE,
      email: 'student1@smpit.sch.id',
      unitId: pesantren.id,
      roleCode: RoleCode.SMPIT_SISWA,
    },
    {
      name: 'Ahmad Fauzan',
      gender: Gender.MALE,
      email: 'student2@smpit.sch.id',
      unitId: pesantren.id,
      roleCode: RoleCode.SMPIT_SISWA,
    },
    {
      name: 'Siti Aisyah',
      gender: Gender.FEMALE,
      email: 'student3@sdit.sch.id',
      unitId: sdIt.id,
      roleCode: RoleCode.SDIT_SISWA,
    },
    {
      name: 'Fatimah Zahra',
      gender: Gender.FEMALE,
      email: 'student4@tkq.sch.id',
      unitId: tkQuran.id,
      roleCode: RoleCode.TKQ_SISWA,
    },
    {
      name: 'Abdullah Rahman',
      gender: Gender.MALE,
      email: 'student5@smaq.sch.id',
      unitId: smaQuran.id,
      roleCode: RoleCode.SMAQ_SISWA,
    },
  ];

  for (let i = 0; i < studentConfigs.length; i++) {
    const studentData = studentConfigs[i];
    const user = await prisma.user.create({
      data: {
        name: studentData.name,
        email: studentData.email,
        passwordHash: await bcrypt.hash('Student123!', 10),
        role: UserRole.STUDENT,
        unitId: studentData.unitId,
        isActive: true,
      },
    });

    // Assign student role
    await prisma.userRoleAssignment.create({
      data: {
        userId: user.id,
        roleId: roles[studentData.roleCode].id,
        unitId: studentData.unitId,
        isPrimary: true,
        isActive: true,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        unitId: studentData.unitId,
        nis: `2024${String(i + 1).padStart(4, '0')}`,
        nisn: `00${String(i + 1).padStart(8, '0')}`,
        gender: studentData.gender,
        birthPlace: 'Sukabumi',
        birthDate: new Date(
          `2012-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
        ),
        address: `Jl. Santri No. ${i + 1}, Sukabumi`,
        parentName: `Bapak ${studentData.name.split(' ')[0]}`,
        parentPhone: `0812345678${String(i).padStart(2, '0')}`,
      },
    });

    students.push(student);

    // Enroll in class (only SMP IT students)
    if (studentData.roleCode === RoleCode.SMPIT_SISWA) {
      await prisma.classEnrollment.create({
        data: {
          studentId: student.id,
          classId: class7A.id,
          status: 'active',
        },
      });
    }
  }

  console.log('✅ Students created and enrolled');

  // Create Parent users (wali santri) with role assignments
  const parentUsers = [];
  const parentNames = [
    {
      name: 'Bapak Rizky (Wali)',
      email: 'parent1@smpit.sch.id',
      studentIdx: 0,
      unitId: pesantren.id,
      roleCode: RoleCode.SMPIT_ORANG_TUA,
    },
    {
      name: 'Ibu Fauzan (Wali)',
      email: 'parent2@smpit.sch.id',
      studentIdx: 1,
      unitId: pesantren.id,
      roleCode: RoleCode.SMPIT_ORANG_TUA,
    },
    {
      name: 'Bapak Aisyah (Wali)',
      email: 'parent3@sdit.sch.id',
      studentIdx: 2,
      unitId: sdIt.id,
      roleCode: RoleCode.SDIT_ORANG_TUA,
    },
  ];

  for (const parentData of parentNames) {
    const parentUser = await prisma.user.create({
      data: {
        name: parentData.name,
        email: parentData.email,
        passwordHash: await bcrypt.hash('Parent123!', 10),
        role: UserRole.PARENT,
        unitId: parentData.unitId,
        isActive: true,
      },
    });

    await prisma.userRoleAssignment.create({
      data: {
        userId: parentUser.id,
        roleId: roles[parentData.roleCode].id,
        unitId: parentData.unitId,
        isPrimary: true,
        isActive: true,
      },
    });

    parentUsers.push({ user: parentUser, studentIdx: parentData.studentIdx });
  }

  console.log('✅ Parent users created');

  // Create Attendance records for today
  const today = new Date();
  for (const student of students) {
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId: class7A.id,
        date: today,
        status: AttendanceStatus.PRESENT,
        recordedById: teacherPesantrenUser.id,
      },
    });
  }

  console.log('✅ Attendance records created');

  // Create Tahfidz records
  for (const student of students.slice(0, 3)) {
    await prisma.tahfidzRecord.create({
      data: {
        studentId: student.id,
        activityType: TahfidzActivityType.ZIYADAH,
        surahNumber: 1,
        surahName: 'Al-Fatihah',
        ayahStart: 1,
        ayahEnd: 7,
        juz: 1,
        totalAyah: 7,
        score: 90,
        notes: 'Hafalan baik dan lancar',
        recordedById: teacherPesantrenUser.id,
      },
    });
  }

  console.log('✅ Tahfidz records created');

  // ============================================
  // PHASE 2: Dormitories, Permits, Violations, Rewards, Finance
  // ============================================

  // Create Dormitories
  const dormitoryPutra = await prisma.dormitory.create({
    data: {
      unitId: pesantren.id,
      name: 'Asrama Putra Al-Hikmah',
      code: 'AP-01',
      gender: Gender.MALE,
      capacity: 100,
      description: 'Asrama putra dengan fasilitas lengkap',
    },
  });

  const dormitoryPutri = await prisma.dormitory.create({
    data: {
      unitId: pesantren.id,
      name: 'Asrama Putri Al-Hikmah',
      code: 'AW-01',
      gender: Gender.FEMALE,
      capacity: 80,
      description: 'Asrama putri dengan lingkungan yang nyaman',
    },
  });

  console.log('✅ Dormitories created');

  // Create Rooms
  const rooms: Array<{ room: Awaited<ReturnType<typeof prisma.room.create>>; gender: Gender }> = [];

  // Putra rooms
  for (let i = 1; i <= 5; i++) {
    const room = await prisma.room.create({
      data: {
        dormitoryId: dormitoryPutra.id,
        name: `Kamar P${i}`,
        floor: Math.ceil(i / 2),
        capacity: 8,
        description: `Kamar putra lantai ${Math.ceil(i / 2)}`,
      },
    });
    rooms.push({ room, gender: Gender.MALE });
  }

  // Putri rooms
  for (let i = 1; i <= 4; i++) {
    const room = await prisma.room.create({
      data: {
        dormitoryId: dormitoryPutri.id,
        name: `Kamar W${i}`,
        floor: Math.ceil(i / 2),
        capacity: 6,
        description: `Kamar putri lantai ${Math.ceil(i / 2)}`,
      },
    });
    rooms.push({ room, gender: Gender.FEMALE });
  }

  console.log('✅ Rooms created');

  // Create Room Assignments
  let maleRoomIndex = 0;
  let femaleRoomIndex = 5; // Start from first female room

  for (const student of students) {
    const studentData = await prisma.student.findUnique({
      where: { id: student.id },
      select: { gender: true },
    });

    let roomData;
    if (studentData?.gender === Gender.MALE) {
      roomData = rooms[maleRoomIndex % 5];
      maleRoomIndex++;
    } else {
      roomData = rooms[femaleRoomIndex % rooms.length];
      if (roomData.gender !== Gender.FEMALE) {
        roomData = rooms[5]; // First female room
      }
      femaleRoomIndex++;
    }

    await prisma.roomAssignment.create({
      data: {
        roomId: roomData.room.id,
        studentId: student.id,
        assignedAt: new Date('2024-07-15'),
        isActive: true,
        notes: 'Penempatan awal tahun ajaran 2024/2025',
      },
    });
  }

  console.log('✅ Room assignments created');

  // Create Permits
  const permitStatuses = [
    PermitStatus.PENDING,
    PermitStatus.APPROVED,
    PermitStatus.COMPLETED,
    PermitStatus.REJECTED,
  ];
  const permitTypes = [PermitType.PULANG, PermitType.KELUAR, PermitType.SAKIT, PermitType.KELUARGA];

  for (let i = 0; i < 4; i++) {
    const student = students[i % students.length];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + i);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    await prisma.permit.create({
      data: {
        studentId: student.id,
        type: permitTypes[i],
        status: permitStatuses[i],
        reason: `Alasan izin ${permitTypes[i].toLowerCase()}: keperluan keluarga`,
        startDate,
        endDate,
        approvedById:
          permitStatuses[i] !== PermitStatus.PENDING ? teacherPesantrenUser.id : undefined,
        approvedAt: permitStatuses[i] !== PermitStatus.PENDING ? new Date() : undefined,
        returnedAt: permitStatuses[i] === PermitStatus.COMPLETED ? new Date() : undefined,
      },
    });
  }

  console.log('✅ Permits created');

  // Create Violations
  const violationDescriptions = [
    {
      type: ViolationType.MINOR,
      category: 'ibadah',
      desc: 'Terlambat sholat berjamaah',
      points: 5,
    },
    {
      type: ViolationType.MINOR,
      category: 'kebersihan',
      desc: 'Tidak merapikan tempat tidur',
      points: 3,
    },
    {
      type: ViolationType.MODERATE,
      category: 'ketertiban',
      desc: 'Tidak mengikuti kegiatan wajib',
      points: 10,
    },
    {
      type: ViolationType.MAJOR,
      category: 'ketertiban',
      desc: 'Keluar asrama tanpa izin',
      points: 25,
    },
  ];

  for (let i = 0; i < violationDescriptions.length; i++) {
    const student = students[i % students.length];
    const violation = violationDescriptions[i];
    const occurredAt = new Date();
    occurredAt.setDate(occurredAt.getDate() - (i + 1));

    await prisma.violation.create({
      data: {
        studentId: student.id,
        type: violation.type,
        category: violation.category,
        description: violation.desc,
        occurredAt,
        points: violation.points,
        reportedById: teacherPesantrenUser.id,
        action: 'Diberi peringatan lisan',
      },
    });
  }

  console.log('✅ Violations created');

  // Create Rewards
  const rewardDescriptions = [
    { category: 'tahfidz', desc: 'Juara 1 Lomba Hafalan', points: 50 },
    { category: 'akhlak', desc: 'Santri teladan bulan ini', points: 30 },
    { category: 'kebersihan', desc: 'Membantu kegiatan kebersihan', points: 10 },
    { category: 'tahfidz', desc: 'Memenangkan kompetisi tahfidz antar pesantren', points: 100 },
  ];

  for (let i = 0; i < rewardDescriptions.length; i++) {
    const student = students[i % students.length];
    const reward = rewardDescriptions[i];
    const givenAt = new Date();
    givenAt.setDate(givenAt.getDate() - i);

    await prisma.reward.create({
      data: {
        studentId: student.id,
        category: reward.category,
        description: reward.desc,
        givenAt,
        points: reward.points,
        givenById: teacherPesantrenUser.id,
      },
    });
  }

  console.log('✅ Rewards created');

  // Create Payment Types
  const paymentTypesData = [
    {
      name: 'SPP Bulanan',
      code: 'SPP',
      amount: new Prisma.Decimal(500000),
      description: 'Biaya pendidikan bulanan',
    },
    {
      name: 'Biaya Makan',
      code: 'MAKAN',
      amount: new Prisma.Decimal(750000),
      description: 'Biaya makan 3x sehari',
    },
    {
      name: 'Biaya Asrama',
      code: 'ASRAMA',
      amount: new Prisma.Decimal(300000),
      description: 'Biaya penginapan asrama',
    },
    {
      name: 'Seragam',
      code: 'SRGM',
      amount: new Prisma.Decimal(1500000),
      description: 'Biaya seragam lengkap',
      isRecurring: false,
    },
    {
      name: 'Kegiatan Ekstrakurikuler',
      code: 'EKSKUL',
      amount: new Prisma.Decimal(100000),
      description: 'Biaya kegiatan tambahan',
    },
  ];

  const createdPaymentTypes = [];
  for (const pt of paymentTypesData) {
    const paymentType = await prisma.paymentType.create({
      data: {
        unitId: pesantren.id,
        name: pt.name,
        code: pt.code,
        amount: pt.amount,
        description: pt.description,
        isRecurring: pt.isRecurring ?? true,
      },
    });
    createdPaymentTypes.push(paymentType);
  }

  console.log('✅ Payment types created');

  // Create Invoices and Payments
  const months = ['Juli', 'Agustus', 'September'];
  let invoiceCounter = 1;
  const sppPaymentType = createdPaymentTypes.find((pt) => pt.code === 'SPP')!;

  for (const student of students.slice(0, 3)) {
    for (let monthIdx = 0; monthIdx < months.length; monthIdx++) {
      const dueDate = new Date(2024, 6 + monthIdx, 10); // 10th of each month
      const status =
        monthIdx === 0
          ? PaymentStatus.PAID
          : monthIdx === 1
            ? PaymentStatus.PARTIAL
            : PaymentStatus.PENDING;

      const totalAmount = Number(sppPaymentType.amount);

      const invoice = await prisma.invoice.create({
        data: {
          studentId: student.id,
          paymentTypeId: sppPaymentType.id,
          invoiceNumber: `INV-2024${String(invoiceCounter++).padStart(5, '0')}`,
          dueDate,
          amount: new Prisma.Decimal(totalAmount),
          paidAmount:
            status === PaymentStatus.PAID
              ? new Prisma.Decimal(totalAmount)
              : status === PaymentStatus.PARTIAL
                ? new Prisma.Decimal(totalAmount / 2)
                : new Prisma.Decimal(0),
          status,
          period: `${months[monthIdx]} 2024`,
          notes: `Tagihan SPP untuk bulan ${months[monthIdx]}`,
        },
      });

      // Create payment for paid/partial invoices
      if (status === PaymentStatus.PAID || status === PaymentStatus.PARTIAL) {
        const paymentAmount = status === PaymentStatus.PAID ? totalAmount : totalAmount / 2;
        const paidAt = new Date(dueDate);
        paidAt.setDate(paidAt.getDate() - 2);

        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: new Prisma.Decimal(paymentAmount),
            paidAt,
            method: PaymentMethod.BANK_TRANSFER,
            referenceNo: `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            notes: `Pembayaran via transfer bank`,
          },
        });
      }
    }
  }

  console.log('✅ Invoices and payments created');

  // ============================================
  // PHASE 3: Staff / HR Data
  // ============================================

  // Create Staff users and profiles
  const staffData = [
    {
      name: 'Pak Bambang Sutejo',
      email: 'bambang@cipansor.id',
      position: 'Kepala TU',
      department: 'Administrasi',
    },
    {
      name: 'Ibu Dewi Kartika',
      email: 'dewi@cipansor.id',
      position: 'Staff Keuangan',
      department: 'Keuangan',
    },
    {
      name: 'Pak Rudi Hartono',
      email: 'rudi@cipansor.id',
      position: 'Security',
      department: 'Keamanan',
    },
    {
      name: 'Ibu Sri Wahyuni',
      email: 'sri@cipansor.id',
      position: 'Petugas Kesehatan',
      department: 'Kesehatan',
    },
  ];

  const staffRecords = [];
  for (let i = 0; i < staffData.length; i++) {
    const data = staffData[i];
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: await bcrypt.hash('Staff123!', 10),
        role: UserRole.STAFF,
        unitId: pesantren.id,
        isActive: true,
      },
    });

    const staff = await prisma.staff.create({
      data: {
        userId: user.id,
        unitId: pesantren.id,
        nip: `199${i}0101202001${String(i + 1).padStart(3, '0')}`,
        position: data.position,
        department: data.department,
        joinDate: new Date(`2020-0${i + 1}-01`),
      },
    });
    staffRecords.push(staff);
  }

  console.log('✅ Staff created');

  // Create Staff Attendance for the past week
  const staffAttendanceStatuses = [
    StaffAttendanceStatus.PRESENT,
    StaffAttendanceStatus.PRESENT,
    StaffAttendanceStatus.LATE,
    StaffAttendanceStatus.PRESENT,
    StaffAttendanceStatus.SICK,
    StaffAttendanceStatus.PRESENT,
    StaffAttendanceStatus.LEAVE,
  ];

  for (const staff of staffRecords) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      date.setHours(0, 0, 0, 0);

      const status =
        staffAttendanceStatuses[
          (staff.id.charCodeAt(0) + dayOffset) % staffAttendanceStatuses.length
        ];

      const checkIn = new Date(date);
      checkIn.setHours(
        7 + (status === StaffAttendanceStatus.LATE ? 1 : 0),
        30 + Math.floor(Math.random() * 30),
        0
      );

      const checkOut = new Date(date);
      checkOut.setHours(16, Math.floor(Math.random() * 60), 0);

      await prisma.staffAttendance.create({
        data: {
          staffId: staff.id,
          date,
          status,
          checkIn:
            status === StaffAttendanceStatus.PRESENT || status === StaffAttendanceStatus.LATE
              ? checkIn
              : undefined,
          checkOut:
            status === StaffAttendanceStatus.PRESENT || status === StaffAttendanceStatus.LATE
              ? checkOut
              : undefined,
          notes:
            status === StaffAttendanceStatus.SICK
              ? 'Izin sakit dengan surat dokter'
              : status === StaffAttendanceStatus.LEAVE
                ? 'Cuti tahunan'
                : status === StaffAttendanceStatus.LATE
                  ? 'Terlambat karena macet'
                  : undefined,
        },
      });
    }
  }

  console.log('✅ Staff attendance created');

  // Create Leave requests
  const leaveData = [
    {
      staffIdx: 0,
      type: LeaveType.ANNUAL,
      days: 3,
      status: LeaveStatus.APPROVED,
      reason: 'Liburan keluarga',
    },
    {
      staffIdx: 1,
      type: LeaveType.SICK,
      days: 2,
      status: LeaveStatus.APPROVED,
      reason: 'Sakit demam',
    },
    {
      staffIdx: 2,
      type: LeaveType.MARRIAGE,
      days: 5,
      status: LeaveStatus.PENDING,
      reason: 'Menghadiri pernikahan anak',
    },
    {
      staffIdx: 3,
      type: LeaveType.OTHER,
      days: 1,
      status: LeaveStatus.REJECTED,
      reason: 'Urusan pribadi',
    },
  ];

  for (const leave of leaveData) {
    const staff = staffRecords[leave.staffIdx];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + leave.days - 1);

    await prisma.leave.create({
      data: {
        staffId: staff.id,
        type: leave.type,
        startDate,
        endDate,
        totalDays: leave.days,
        reason: leave.reason,
        status: leave.status,
        approvedById: leave.status !== LeaveStatus.PENDING ? teacherPesantrenUser.id : undefined,
        approvedAt: leave.status !== LeaveStatus.PENDING ? new Date() : undefined,
        rejectedNote:
          leave.status === LeaveStatus.REJECTED ? 'Tidak memenuhi persyaratan cuti' : undefined,
      },
    });
  }

  console.log('✅ Leave requests created');

  // ============================================
  // PHASE 3: PSB (Penerimaan Santri Baru)
  // ============================================

  // Create Admission Period
  const admissionPeriod = await prisma.admissionPeriod.create({
    data: {
      unitId: pesantren.id,
      academicYearId: academicYear.id,
      name: 'PSB 2024/2025 Gelombang 1',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-05-31'),
      quota: 50,
      registrationFee: new Prisma.Decimal(350000),
      isActive: true,
      requirements: JSON.stringify([
        'Fotokopi Akta Kelahiran',
        'Fotokopi Kartu Keluarga',
        'Ijazah SD/MI atau Surat Keterangan Lulus',
        'Pas Foto 3x4 (4 lembar)',
        'Surat Keterangan Sehat',
      ]),
    },
  });

  const admissionPeriod2 = await prisma.admissionPeriod.create({
    data: {
      unitId: pesantren.id,
      academicYearId: academicYear.id,
      name: 'PSB 2024/2025 Gelombang 2',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      quota: 20,
      registrationFee: new Prisma.Decimal(350000),
      isActive: false,
      requirements: JSON.stringify([
        'Fotokopi Akta Kelahiran',
        'Fotokopi Kartu Keluarga',
        'Ijazah SD/MI atau Surat Keterangan Lulus',
        'Pas Foto 3x4 (4 lembar)',
        'Surat Keterangan Sehat',
      ]),
    },
  });

  console.log('✅ Admission periods created');

  // Create Registrants with various statuses
  const registrantData = [
    {
      name: 'Farid Hidayat',
      gender: Gender.MALE,
      status: AdmissionStatus.ENROLLED,
      parentName: 'Bapak Hidayat',
    },
    {
      name: 'Nurul Aini',
      gender: Gender.FEMALE,
      status: AdmissionStatus.ACCEPTED,
      parentName: 'Bapak Ahmad',
    },
    {
      name: 'Rizki Ramadhan',
      gender: Gender.MALE,
      status: AdmissionStatus.TEST_COMPLETED,
      parentName: 'Bapak Ramadhan',
    },
    {
      name: 'Salsabila Putri',
      gender: Gender.FEMALE,
      status: AdmissionStatus.DOCUMENT_CHECK,
      parentName: 'Bapak Putra',
    },
    {
      name: 'Akbar Maulana',
      gender: Gender.MALE,
      status: AdmissionStatus.REGISTERED,
      parentName: 'Bapak Maulana',
    },
    {
      name: 'Azzahra Aulia',
      gender: Gender.FEMALE,
      status: AdmissionStatus.REJECTED,
      parentName: 'Bapak Aulia',
    },
  ];

  let regCounter = 1;
  for (const reg of registrantData) {
    const registrant = await prisma.registrant.create({
      data: {
        admissionPeriodId: admissionPeriod.id,
        registrationNo: `REG-2024-${String(regCounter++).padStart(4, '0')}`,
        name: reg.name,
        gender: reg.gender,
        birthPlace: 'Sukabumi',
        birthDate: new Date('2012-05-15'),
        address: 'Jl. Pendaftaran No. ' + regCounter + ', Sukabumi',
        phone: `0812345600${regCounter}`,
        email: `${reg.name.toLowerCase().replace(' ', '.')}@gmail.com`,
        previousSchool: 'SD Negeri Sukabumi ' + regCounter,
        parentName: reg.parentName,
        parentPhone: `0812345700${regCounter}`,
        parentEmail: `parent${regCounter}@gmail.com`,
        parentOccupation: 'Wiraswasta',
        status: reg.status,
        testScore:
          reg.status === AdmissionStatus.TEST_COMPLETED ||
          reg.status === AdmissionStatus.ACCEPTED ||
          reg.status === AdmissionStatus.ENROLLED
            ? new Prisma.Decimal(75 + Math.random() * 20)
            : undefined,
        interviewScore:
          reg.status === AdmissionStatus.ACCEPTED || reg.status === AdmissionStatus.ENROLLED
            ? new Prisma.Decimal(70 + Math.random() * 25)
            : undefined,
        tahfidzScore:
          reg.status === AdmissionStatus.ACCEPTED || reg.status === AdmissionStatus.ENROLLED
            ? new Prisma.Decimal(80 + Math.random() * 15)
            : undefined,
        acceptedAt:
          reg.status === AdmissionStatus.ACCEPTED || reg.status === AdmissionStatus.ENROLLED
            ? new Date()
            : undefined,
        enrolledAt: reg.status === AdmissionStatus.ENROLLED ? new Date() : undefined,
        notes:
          reg.status === AdmissionStatus.REJECTED
            ? 'Tidak memenuhi persyaratan usia minimum'
            : undefined,
      },
    });

    // Create registrant documents
    await prisma.registrantDocument.createMany({
      data: [
        {
          registrantId: registrant.id,
          name: 'Akta Kelahiran',
          type: 'akta',
          isVerified: reg.status !== AdmissionStatus.REGISTERED,
        },
        {
          registrantId: registrant.id,
          name: 'Kartu Keluarga',
          type: 'kk',
          isVerified: reg.status !== AdmissionStatus.REGISTERED,
        },
        {
          registrantId: registrant.id,
          name: 'Pas Foto',
          type: 'foto',
          isVerified: reg.status !== AdmissionStatus.REGISTERED,
        },
      ],
    });
  }

  console.log('✅ Registrants created');

  // ============================================
  // PHASE 4: PERPUSTAKAAN (LIBRARY)
  // ============================================

  // Create Book Categories
  const bookCategoriesData = [
    { name: 'Fiqih', code: 'FIQ', description: 'Buku-buku Fiqih Islam' },
    { name: 'Hadits', code: 'HAD', description: 'Buku-buku Hadits dan Ilmu Hadits' },
    { name: 'Tafsir', code: 'TAF', description: 'Buku-buku Tafsir Al-Quran' },
    { name: 'Akhlak', code: 'AKH', description: 'Buku-buku Akhlak dan Tasawuf' },
    { name: 'Umum', code: 'UMM', description: 'Buku-buku Pengetahuan Umum' },
  ];

  const bookCategories = [];
  for (const cat of bookCategoriesData) {
    const category = await prisma.bookCategory.create({
      data: {
        unitId: pesantren.id,
        name: cat.name,
        code: cat.code,
        description: cat.description,
      },
    });
    bookCategories.push(category);
  }

  console.log('✅ Book categories created');

  // Create Books
  const booksData = [
    {
      title: 'Fiqih Sunnah',
      author: 'Sayyid Sabiq',
      categoryIdx: 0,
      isbn: '978-979-1234-01-1',
      quantity: 5,
    },
    {
      title: 'Riyadhus Shalihin',
      author: 'Imam An-Nawawi',
      categoryIdx: 1,
      isbn: '978-979-1234-02-2',
      quantity: 3,
    },
    {
      title: 'Tafsir Ibnu Katsir',
      author: 'Ibnu Katsir',
      categoryIdx: 2,
      isbn: '978-979-1234-03-3',
      quantity: 2,
    },
    {
      title: 'Ihya Ulumuddin',
      author: 'Imam Al-Ghazali',
      categoryIdx: 3,
      isbn: '978-979-1234-04-4',
      quantity: 4,
    },
    {
      title: 'Ensiklopedia Islam',
      author: 'Tim Penulis',
      categoryIdx: 4,
      isbn: '978-979-1234-05-5',
      quantity: 6,
    },
    {
      title: 'Bulughul Maram',
      author: 'Ibnu Hajar Al-Asqalani',
      categoryIdx: 1,
      isbn: '978-979-1234-06-6',
      quantity: 4,
    },
    {
      title: 'Fathul Bari',
      author: 'Ibnu Hajar Al-Asqalani',
      categoryIdx: 1,
      isbn: '978-979-1234-07-7',
      quantity: 2,
    },
    {
      title: 'Tafsir Al-Misbah',
      author: 'M. Quraish Shihab',
      categoryIdx: 2,
      isbn: '978-979-1234-08-8',
      quantity: 3,
    },
  ];

  const books = [];
  for (const bookData of booksData) {
    const book = await prisma.book.create({
      data: {
        unitId: pesantren.id,
        categoryId: bookCategories[bookData.categoryIdx].id,
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        publisher: 'Penerbit Islam Nusantara',
        publishYear: 2020 + Math.floor(Math.random() * 4),
        language: 'Indonesia',
        pageCount: 200 + Math.floor(Math.random() * 500),
        shelfLocation: `${bookCategories[bookData.categoryIdx].code}-${String(Math.floor(Math.random() * 10) + 1).padStart(2, '0')}`,
        quantity: bookData.quantity,
        available: bookData.quantity - 1,
        description: `${bookData.title} karya ${bookData.author}`,
        status: BookStatus.AVAILABLE,
      },
    });
    books.push(book);
  }

  console.log('✅ Books created');

  // Create Borrowings
  const borrowingsData = [
    { studentIdx: 0, bookIdx: 0, daysAgo: 14, status: BorrowingStatus.RETURNED },
    { studentIdx: 1, bookIdx: 1, daysAgo: 7, status: BorrowingStatus.ACTIVE },
    { studentIdx: 2, bookIdx: 2, daysAgo: 21, status: BorrowingStatus.OVERDUE },
    { studentIdx: 0, bookIdx: 3, daysAgo: 3, status: BorrowingStatus.ACTIVE },
    { studentIdx: 3, bookIdx: 4, daysAgo: 10, status: BorrowingStatus.RETURNED },
  ];

  for (const borrow of borrowingsData) {
    const borrowedAt = new Date();
    borrowedAt.setDate(borrowedAt.getDate() - borrow.daysAgo);
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(dueDate.getDate() + 14); // 2 weeks loan period

    await prisma.borrowing.create({
      data: {
        bookId: books[borrow.bookIdx].id,
        borrowerId: students[borrow.studentIdx].id,
        borrowerType: 'STUDENT',
        borrowedAt,
        dueDate,
        status: borrow.status,
        returnedAt: borrow.status === BorrowingStatus.RETURNED ? new Date() : undefined,
        lateFee: borrow.status === BorrowingStatus.OVERDUE ? new Prisma.Decimal(5000) : undefined,
        processedBy: teacherPesantrenUser.id,
      },
    });
  }

  console.log('✅ Borrowings created');

  // ============================================
  // PHASE 4: UKS (HEALTH / KESEHATAN)
  // ============================================

  // Create Medications
  const medicationsData = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      type: 'tablet',
      dosageForm: '500mg',
      quantity: 100,
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin Trihydrate',
      type: 'kapsul',
      dosageForm: '500mg',
      quantity: 50,
    },
    {
      name: 'OBH Combi',
      genericName: 'Obat Batuk Hitam',
      type: 'sirup',
      dosageForm: '60ml',
      quantity: 20,
    },
    {
      name: 'Minyak Kayu Putih',
      genericName: 'Cajuput Oil',
      type: 'minyak',
      dosageForm: '30ml',
      quantity: 15,
    },
    {
      name: 'Betadine',
      genericName: 'Povidone-Iodine',
      type: 'cairan',
      dosageForm: '60ml',
      quantity: 10,
    },
    {
      name: 'Antangin JRG',
      genericName: 'Herbal',
      type: 'tablet',
      dosageForm: '1 strip',
      quantity: 30,
    },
  ];

  const medications = [];
  for (const med of medicationsData) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);

    const medication = await prisma.medication.create({
      data: {
        unitId: pesantren.id,
        name: med.name,
        genericName: med.genericName,
        type: med.type,
        dosageForm: med.dosageForm,
        quantity: med.quantity,
        minStock: 10,
        expiryDate,
        supplier: 'Apotek Sehat Jaya',
      },
    });
    medications.push(medication);
  }

  console.log('✅ Medications created');

  // Create Medical Records
  const medicalRecordsData = [
    {
      studentIdx: 0,
      type: MedicalRecordType.ILLNESS,
      complaint: 'Demam dan batuk',
      diagnosis: 'Flu',
      treatment: 'Istirahat dan minum obat',
    },
    {
      studentIdx: 1,
      type: MedicalRecordType.INJURY,
      complaint: 'Luka gores di lutut',
      diagnosis: 'Luka ringan',
      treatment: 'Dibersihkan dan dibalut',
    },
    {
      studentIdx: 2,
      type: MedicalRecordType.CHECKUP,
      complaint: 'Pemeriksaan rutin',
      diagnosis: 'Sehat',
      treatment: 'Tidak ada',
    },
    {
      studentIdx: 3,
      type: MedicalRecordType.FIRST_AID,
      complaint: 'Pusing dan lemas',
      diagnosis: 'Kelelahan',
      treatment: 'Istirahat dan minum air',
    },
    {
      studentIdx: 0,
      type: MedicalRecordType.REFERRAL,
      complaint: 'Sakit perut berkepanjangan',
      diagnosis: 'Perlu pemeriksaan lanjut',
      treatment: 'Dirujuk ke RS',
    },
  ];

  for (let i = 0; i < medicalRecordsData.length; i++) {
    const record = medicalRecordsData[i];
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() - i * 3);

    await prisma.medicalRecord.create({
      data: {
        studentId: students[record.studentIdx].id,
        type: record.type,
        visitDate,
        complaint: record.complaint,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        prescription: record.type === MedicalRecordType.ILLNESS ? 'Paracetamol 3x1' : undefined,
        referredTo: record.type === MedicalRecordType.REFERRAL ? 'RS Sukabumi Medika' : undefined,
        recordedById: teacherPesantrenUser.id,
      },
    });
  }

  console.log('✅ Medical records created');

  // Create Medication Usage Logs
  for (let i = 0; i < 3; i++) {
    const givenAt = new Date();
    givenAt.setDate(givenAt.getDate() - i);

    await prisma.medicationUsageLog.create({
      data: {
        medicationId: medications[i].id,
        studentId: students[i].id,
        quantity: 2,
        reason: 'Pengobatan sakit ' + ['demam', 'batuk', 'flu'][i],
        givenById: teacherPesantrenUser.id,
        givenAt,
      },
    });
  }

  console.log('✅ Medication usage logs created');

  // ============================================
  // PHASE 4: INVENTARIS (INVENTORY)
  // ============================================

  // Create Asset Categories
  const assetCategoriesData = [
    { name: 'Mebel', code: 'MBL', description: 'Meja, kursi, lemari, dll' },
    { name: 'Elektronik', code: 'ELK', description: 'Komputer, AC, proyektor, dll' },
    { name: 'Kendaraan', code: 'KND', description: 'Mobil, motor, sepeda' },
    { name: 'Peralatan Dapur', code: 'DPR', description: 'Kompor, kulkas, peralatan masak' },
    { name: 'Alat Olahraga', code: 'OLR', description: 'Bola, matras, alat fitness' },
  ];

  const assetCategories = [];
  for (const cat of assetCategoriesData) {
    const category = await prisma.assetCategory.create({
      data: {
        name: cat.name,
        code: cat.code,
        description: cat.description,
      },
    });
    assetCategories.push(category);
  }

  console.log('✅ Asset categories created');

  // Create Assets
  const assetsData = [
    {
      name: 'Meja Guru',
      categoryIdx: 0,
      brand: 'Informa',
      price: 1500000,
      location: 'Ruang Guru',
      condition: AssetCondition.GOOD,
    },
    {
      name: 'Kursi Plastik',
      categoryIdx: 0,
      brand: 'Napoly',
      price: 150000,
      location: 'Ruang Kelas',
      condition: AssetCondition.FAIR,
    },
    {
      name: 'Proyektor Epson',
      categoryIdx: 1,
      brand: 'Epson',
      price: 8500000,
      location: 'Aula',
      condition: AssetCondition.EXCELLENT,
    },
    {
      name: 'AC Split 1 PK',
      categoryIdx: 1,
      brand: 'Daikin',
      price: 5000000,
      location: 'Ruang Kepala',
      condition: AssetCondition.GOOD,
    },
    {
      name: 'Komputer Desktop',
      categoryIdx: 1,
      brand: 'HP',
      price: 12000000,
      location: 'Lab Komputer',
      condition: AssetCondition.GOOD,
    },
    {
      name: 'Mobil Operasional',
      categoryIdx: 2,
      brand: 'Toyota Avanza',
      price: 200000000,
      location: 'Garasi',
      condition: AssetCondition.GOOD,
    },
    {
      name: 'Kulkas 2 Pintu',
      categoryIdx: 3,
      brand: 'Samsung',
      price: 7500000,
      location: 'Dapur',
      condition: AssetCondition.GOOD,
    },
    {
      name: 'Bola Sepak',
      categoryIdx: 4,
      brand: 'Mikasa',
      price: 350000,
      location: 'Gudang Olahraga',
      condition: AssetCondition.FAIR,
    },
  ];

  const assets = [];
  let assetCounter = 1;
  for (const assetData of assetsData) {
    const purchaseDate = new Date();
    purchaseDate.setFullYear(purchaseDate.getFullYear() - Math.floor(Math.random() * 3));

    const warrantyExpiry = new Date(purchaseDate);
    warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 2);

    const asset = await prisma.asset.create({
      data: {
        unitId: pesantren.id,
        categoryId: assetCategories[assetData.categoryIdx].id,
        code: `INV-${assetCategories[assetData.categoryIdx].code}-${String(assetCounter++).padStart(4, '0')}`,
        name: assetData.name,
        brand: assetData.brand,
        purchaseDate,
        purchasePrice: new Prisma.Decimal(assetData.price),
        supplier: 'Supplier ' + assetData.brand,
        location: assetData.location,
        condition: assetData.condition,
        status: AssetStatus.ACTIVE,
        warrantyExpiry,
      },
    });
    assets.push(asset);
  }

  console.log('✅ Assets created');

  // Create Asset Maintenance Logs
  const maintenanceData = [
    {
      assetIdx: 2,
      type: 'servis',
      description: 'Pembersihan filter dan penggantian lampu',
      cost: 500000,
    },
    { assetIdx: 3, type: 'perbaikan', description: 'Pengisian freon AC', cost: 350000 },
    { assetIdx: 5, type: 'servis', description: 'Servis berkala 20.000 km', cost: 1500000 },
    { assetIdx: 4, type: 'penggantian', description: 'Upgrade RAM 8GB ke 16GB', cost: 800000 },
  ];

  for (let i = 0; i < maintenanceData.length; i++) {
    const maint = maintenanceData[i];
    const maintenanceDate = new Date();
    maintenanceDate.setDate(maintenanceDate.getDate() - i * 30);

    const nextSchedule = new Date(maintenanceDate);
    nextSchedule.setMonth(nextSchedule.getMonth() + 6);

    await prisma.assetMaintenance.create({
      data: {
        assetId: assets[maint.assetIdx].id,
        maintenanceDate,
        type: maint.type,
        description: maint.description,
        cost: new Prisma.Decimal(maint.cost),
        vendor: 'Jasa Teknik Sukabumi',
        performedBy: 'Teknisi Eksternal',
        nextSchedule,
      },
    });
  }

  console.log('✅ Asset maintenance logs created');

  // ============================================
  // PHASE 4: KOMUNIKASI (NOTIFICATIONS)
  // ============================================

  // Create Announcements
  const announcementsData = [
    {
      title: 'Libur Semester Ganjil',
      content:
        'Libur semester ganjil akan dilaksanakan pada tanggal 20 Desember 2024 s/d 5 Januari 2025.',
      priority: 2,
      targetRoles: ['STUDENT', 'PARENT', 'TEACHER'],
    },
    {
      title: 'Jadwal Ujian Akhir Semester',
      content:
        'Ujian Akhir Semester akan dilaksanakan pada tanggal 10-18 Desember 2024. Mohon persiapkan diri dengan baik.',
      priority: 1,
      targetRoles: ['STUDENT', 'PARENT'],
    },
    {
      title: 'Pembayaran SPP Bulan Desember',
      content: 'Batas akhir pembayaran SPP bulan Desember adalah tanggal 10 Desember 2024.',
      priority: 1,
      targetRoles: ['PARENT'],
    },
    {
      title: 'Kegiatan Maulid Nabi',
      content:
        'Peringatan Maulid Nabi Muhammad SAW akan diadakan pada tanggal 12 Rabiul Awal. Seluruh santri wajib hadir.',
      priority: 0,
      targetRoles: ['STUDENT', 'TEACHER', 'STAFF'],
    },
  ];

  for (let i = 0; i < announcementsData.length; i++) {
    const ann = announcementsData[i];
    const publishedAt = new Date();
    publishedAt.setDate(publishedAt.getDate() - i);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.announcement.create({
      data: {
        unitId: pesantren.id,
        title: ann.title,
        content: ann.content,
        type: NotificationType.ANNOUNCEMENT,
        priority: ann.priority,
        publishedAt,
        expiresAt,
        targetRoles: ann.targetRoles,
        createdById: teacherPesantrenUser.id,
      },
    });
  }

  console.log('✅ Announcements created');

  // Create Personal Notifications for students
  const notificationsData = [
    {
      title: 'Tagihan SPP',
      message: 'Tagihan SPP bulan Desember telah tersedia. Silakan lakukan pembayaran.',
      type: NotificationType.PAYMENT,
    },
    {
      title: 'Jadwal Tasmi',
      message: 'Jadwal tasmi Anda adalah hari Senin pukul 08:00.',
      type: NotificationType.REMINDER,
    },
    {
      title: 'Hasil Ujian',
      message: 'Hasil ujian Fiqih telah tersedia. Silakan cek di halaman akademik.',
      type: NotificationType.ACADEMIC,
    },
    {
      title: 'Peringatan Kehadiran',
      message: 'Kehadiran Anda di bawah 80%. Mohon tingkatkan kehadiran.',
      type: NotificationType.ALERT,
    },
  ];

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const studentUser = await prisma.user.findUnique({ where: { id: student.userId } });
    if (!studentUser) continue;

    // Create 2 notifications per student
    for (let j = 0; j < 2; j++) {
      const notifData = notificationsData[(i + j) % notificationsData.length];
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - j);

      await prisma.notification.create({
        data: {
          userId: studentUser.id,
          type: notifData.type,
          title: notifData.title,
          message: notifData.message,
          status: j === 0 ? NotificationStatus.UNREAD : NotificationStatus.READ,
          readAt: j === 0 ? undefined : new Date(),
          createdAt,
        },
      });
    }
  }

  console.log('✅ Notifications created');

  // ============================================
  // PHASE 5: KURIKULUM (CURRICULUM)
  // ============================================

  // Create Subjects
  const subjectsData = [
    { code: 'MTK', name: 'Matematika', type: SubjectType.ACADEMIC, credits: 4 },
    { code: 'IPA', name: 'Ilmu Pengetahuan Alam', type: SubjectType.ACADEMIC, credits: 4 },
    { code: 'IPS', name: 'Ilmu Pengetahuan Sosial', type: SubjectType.ACADEMIC, credits: 3 },
    { code: 'BIN', name: 'Bahasa Indonesia', type: SubjectType.ACADEMIC, credits: 4 },
    { code: 'BIG', name: 'Bahasa Inggris', type: SubjectType.ACADEMIC, credits: 3 },
    { code: 'FIQ', name: 'Fiqih', type: SubjectType.RELIGIOUS, credits: 2 },
    { code: 'AQD', name: 'Aqidah Akhlak', type: SubjectType.RELIGIOUS, credits: 2 },
    { code: 'QHD', name: 'Quran Hadits', type: SubjectType.RELIGIOUS, credits: 2 },
    { code: 'SKI', name: 'Sejarah Kebudayaan Islam', type: SubjectType.RELIGIOUS, credits: 2 },
    { code: 'THF', name: 'Tahfidz Al-Quran', type: SubjectType.TAHFIDZ, credits: 4 },
    { code: 'ARB', name: 'Bahasa Arab', type: SubjectType.RELIGIOUS, credits: 3 },
    { code: 'PJK', name: 'Pendidikan Jasmani', type: SubjectType.EXTRACURRICULAR, credits: 2 },
  ];

  const subjects = [];
  for (const subj of subjectsData) {
    const subject = await prisma.subject.create({
      data: {
        unitId: pesantren.id,
        code: subj.code,
        name: subj.name,
        type: subj.type,
        credits: subj.credits,
        level: '7',
        isActive: true,
      },
    });
    subjects.push(subject);
  }

  console.log('✅ Subjects created');

  // Seed Kurikulum Merdeka Learning Outcomes (sekarang subjects sudah ada)
  await seedKurikulumMerdeka(prisma, pesantren.id, academicYear.id);

  // Assign teacher to subjects
  for (let i = 0; i < 4; i++) {
    await prisma.teacherSubject.create({
      data: {
        teacherId: teacherPesantren.id,
        subjectId: subjects[i].id,
        classId: class7A.id,
        isActive: true,
      },
    });
  }

  console.log('✅ Teacher subjects assigned');

  // Create Schedules
  const schedulesData = [
    { subjectIdx: 0, day: DayOfWeek.MONDAY, startTime: '07:30', endTime: '08:50' },
    { subjectIdx: 5, day: DayOfWeek.MONDAY, startTime: '09:00', endTime: '09:45' },
    { subjectIdx: 9, day: DayOfWeek.MONDAY, startTime: '10:00', endTime: '11:30' },
    { subjectIdx: 1, day: DayOfWeek.TUESDAY, startTime: '07:30', endTime: '08:50' },
    { subjectIdx: 6, day: DayOfWeek.TUESDAY, startTime: '09:00', endTime: '09:45' },
    { subjectIdx: 10, day: DayOfWeek.TUESDAY, startTime: '10:00', endTime: '11:30' },
    { subjectIdx: 2, day: DayOfWeek.WEDNESDAY, startTime: '07:30', endTime: '08:50' },
    { subjectIdx: 7, day: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '09:45' },
    { subjectIdx: 3, day: DayOfWeek.THURSDAY, startTime: '07:30', endTime: '08:50' },
    { subjectIdx: 8, day: DayOfWeek.THURSDAY, startTime: '09:00', endTime: '09:45' },
    { subjectIdx: 4, day: DayOfWeek.FRIDAY, startTime: '07:30', endTime: '08:50' },
    { subjectIdx: 11, day: DayOfWeek.FRIDAY, startTime: '09:00', endTime: '10:30' },
  ];

  for (const sched of schedulesData) {
    await prisma.schedule.create({
      data: {
        unitId: pesantren.id,
        academicYearId: academicYear.id,
        classId: class7A.id,
        subjectId: subjects[sched.subjectIdx].id,
        teacherId: teacherPesantren.id,
        dayOfWeek: sched.day,
        startTime: sched.startTime,
        endTime: sched.endTime,
        room: 'Ruang 7A',
        isActive: true,
      },
    });
  }

  console.log('✅ Schedules created');

  // Create Lesson Plans
  const lessonPlansData = [
    {
      subjectIdx: 0,
      title: 'Bilangan Bulat',
      topic: 'Operasi Bilangan Bulat',
      objectives: 'Siswa dapat melakukan operasi penjumlahan dan pengurangan bilangan bulat',
    },
    {
      subjectIdx: 5,
      title: 'Thaharah',
      topic: 'Wudhu dan Tayamum',
      objectives: 'Siswa dapat memahami tata cara wudhu dan tayamum yang benar',
    },
    {
      subjectIdx: 9,
      title: 'Surah Al-Baqarah',
      topic: 'Hafalan Ayat 1-5',
      objectives: 'Siswa dapat menghafal Surah Al-Baqarah ayat 1-5 dengan tartil',
    },
  ];

  for (const lp of lessonPlansData) {
    const plannedDate = new Date();
    plannedDate.setDate(plannedDate.getDate() + lp.subjectIdx);

    await prisma.lessonPlan.create({
      data: {
        subjectId: subjects[lp.subjectIdx].id,
        teacherId: teacherPesantren.id,
        classId: class7A.id,
        title: lp.title,
        topic: lp.topic,
        objectives: lp.objectives,
        materials: 'Buku paket, LKS, papan tulis',
        activities: 'Pembukaan, materi inti, latihan soal, penutup',
        assessment: 'Tes tertulis dan praktik',
        duration: 90,
        plannedDate,
      },
    });
  }

  console.log('✅ Lesson plans created');

  // ============================================
  // PHASE 5: PENILAIAN (ASSESSMENT)
  // ============================================

  // Create Exams
  const examsData = [
    {
      subjectIdx: 0,
      type: ExamType.DAILY_TEST,
      title: 'Ulangan Harian 1 - Bilangan Bulat',
      maxScore: 100,
      passingScore: 70,
    },
    {
      subjectIdx: 0,
      type: ExamType.MIDTERM,
      title: 'UTS Matematika',
      maxScore: 100,
      passingScore: 70,
    },
    {
      subjectIdx: 5,
      type: ExamType.DAILY_TEST,
      title: 'Ulangan Harian Fiqih - Thaharah',
      maxScore: 100,
      passingScore: 75,
    },
    {
      subjectIdx: 9,
      type: ExamType.TAHFIDZ_TEST,
      title: 'Ujian Tahfidz - Juz 30',
      maxScore: 100,
      passingScore: 80,
    },
  ];

  const exams = [];
  for (let i = 0; i < examsData.length; i++) {
    const examData = examsData[i];
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() - (10 - i * 3));

    const exam = await prisma.exam.create({
      data: {
        unitId: pesantren.id,
        academicYearId: academicYear.id,
        subjectId: subjects[examData.subjectIdx].id,
        classId: class7A.id,
        teacherId: teacherPesantren.id,
        type: examData.type,
        title: examData.title,
        description: `${examData.title} untuk kelas 7A`,
        scheduledAt,
        duration: 60,
        maxScore: new Prisma.Decimal(examData.maxScore),
        passingScore: new Prisma.Decimal(examData.passingScore),
        weight: new Prisma.Decimal(1),
        status: ExamStatus.GRADED,
      },
    });
    exams.push(exam);
  }

  console.log('✅ Exams created');

  // Create Grades for students
  const gradeScores = [85, 78, 92, 88, 75];

  for (let examIdx = 0; examIdx < exams.length; examIdx++) {
    const exam = exams[examIdx];
    for (let studentIdx = 0; studentIdx < students.length; studentIdx++) {
      const student = students[studentIdx];
      const score =
        gradeScores[(studentIdx + examIdx) % gradeScores.length] + (Math.random() * 10 - 5);
      const percentage = score;
      const letterGrade =
        percentage >= 90
          ? 'A'
          : percentage >= 80
            ? 'B'
            : percentage >= 70
              ? 'C'
              : percentage >= 60
                ? 'D'
                : 'E';

      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: exam.subjectId,
          examId: exam.id,
          academicYearId: academicYear.id,
          type: exam.type === ExamType.TAHFIDZ_TEST ? GradeType.TAHFIDZ : GradeType.EXAM,
          score: new Prisma.Decimal(score),
          maxScore: new Prisma.Decimal(100),
          percentage: new Prisma.Decimal(percentage),
          letterGrade,
          gradedById: teacherPesantrenUser.id,
        },
      });
    }
  }

  console.log('✅ Grades created');

  // Create Report Cards
  for (const student of students.slice(0, 3)) {
    const reportCard = await prisma.reportCard.create({
      data: {
        studentId: student.id,
        classId: class7A.id,
        academicYearId: academicYear.id,
        semester: 1,
        averageScore: new Prisma.Decimal(82.5 + Math.random() * 10),
        rank: students.indexOf(student) + 1,
        totalStudents: students.length,
        attendance: { present: 45, absent: 2, sick: 3, excused: 0 },
        tahfidzSummary: { lastJuz: 30, lastSurah: 'An-Nas', totalAyah: 100 },
        teacherNotes: 'Santri yang rajin dan tekun dalam belajar',
        isPublished: false,
      },
    });

    // Add report card details
    for (let i = 0; i < 5; i++) {
      await prisma.reportCardDetail.create({
        data: {
          reportCardId: reportCard.id,
          subjectName: subjects[i].name,
          dailyScore: new Prisma.Decimal(75 + Math.random() * 20),
          midtermScore: new Prisma.Decimal(70 + Math.random() * 25),
          finalScore: new Prisma.Decimal(75 + Math.random() * 20),
          averageScore: new Prisma.Decimal(75 + Math.random() * 15),
          letterGrade: 'B',
          description: 'Capaian pembelajaran baik',
        },
      });
    }
  }

  console.log('✅ Report cards created');

  // ============================================
  // PHASE 6: ALUMNI & ANALYTICS
  // ============================================

  // Create Alumni (graduates from past years)
  const alumniData = [
    {
      name: 'Ahmad Zaki Rahman',
      gender: Gender.MALE,
      graduationYear: 2020,
      email: 'ahmad.zaki@gmail.com',
      phone: '081200000001',
      notes: 'Alumni angkatan 2020 yang sukses di bidang IT',
      lastClass: 'XII IPA 1',
      tahfidzLevel: '30 Juz',
      city: 'Jakarta',
      province: 'DKI Jakarta',
    },
    {
      name: 'Siti Maryam Azzahra',
      gender: Gender.FEMALE,
      graduationYear: 2020,
      email: 'maryam.azzahra@gmail.com',
      phone: '081200000002',
      notes: 'Pengajar tahfidz di pesantren',
      lastClass: 'XII IPA 1',
      tahfidzLevel: '30 Juz',
      city: 'Bogor',
      province: 'Jawa Barat',
    },
    {
      name: 'Muhammad Firdaus',
      gender: Gender.MALE,
      graduationYear: 2021,
      email: 'firdaus.dokter@gmail.com',
      phone: '081200000003',
      notes: 'Dokter umum dan alumni berprestasi',
      lastClass: 'XII IPA 1',
      tahfidzLevel: '20 Juz',
      city: 'Jakarta',
      province: 'DKI Jakarta',
    },
    {
      name: 'Fatimah Nur Rahma',
      gender: Gender.FEMALE,
      graduationYear: 2021,
      email: 'fatimah.rahma@gmail.com',
      phone: '081200000004',
      notes: 'Pengusaha muda di bidang fashion muslim',
      lastClass: 'XII IPA 1',
      tahfidzLevel: '15 Juz',
      city: 'Bandung',
      province: 'Jawa Barat',
    },
    {
      name: 'Abdullah Hasan',
      gender: Gender.MALE,
      graduationYear: 2022,
      email: 'abdullah.hasan@gmail.com',
      phone: '081200000005',
      notes: 'Imam dan guru tahfidz',
      lastClass: 'XII IPA 1',
      tahfidzLevel: '30 Juz',
      city: 'Sukabumi',
      province: 'Jawa Barat',
    },
    {
      name: 'Aisyah Putri Dewi',
      gender: Gender.FEMALE,
      graduationYear: 2022,
      email: 'aisyah.dewi@gmail.com',
      phone: '081200000006',
      notes: 'Guru Bahasa Indonesia',
      lastClass: 'XII IPS 1',
      tahfidzLevel: '10 Juz',
      city: 'Sukabumi',
      province: 'Jawa Barat',
    },
    {
      name: 'Umar Faruk',
      gender: Gender.MALE,
      graduationYear: 2023,
      email: 'umar.faruk@gmail.com',
      phone: '081200000007',
      notes: 'Fresh graduate, sedang mencari pekerjaan',
      lastClass: 'XII IPA 1',
      tahfidzLevel: '25 Juz',
      city: 'Sukabumi',
      province: 'Jawa Barat',
    },
    {
      name: 'Khadijah Salsabila',
      gender: Gender.FEMALE,
      graduationYear: 2023,
      email: 'khadijah.sabil@gmail.com',
      phone: '081200000008',
      notes: 'Mahasiswa Fakultas Ekonomi UI',
      lastClass: 'XII IPS 1',
      tahfidzLevel: '15 Juz',
      city: 'Depok',
      province: 'Jawa Barat',
    },
  ];

  const alumni = [];
  for (let idx = 0; idx < alumniData.length; idx++) {
    const data = alumniData[idx];
    const alum = await prisma.alumni.create({
      data: {
        unitId: pesantren.id,
        registrationNo: `ALM-${data.graduationYear}-${String(idx + 1).padStart(4, '0')}`,
        name: data.name,
        gender: data.gender,
        graduationYear: data.graduationYear,
        phone: data.phone,
        email: data.email,
        address: 'Jl. Sukabumi Raya No. ' + (idx + 1),
        city: data.city,
        province: data.province,
        lastClass: data.lastClass,
        tahfidzLevel: data.tahfidzLevel,
        status: idx < 6 ? AlumniStatus.ACTIVE : AlumniStatus.INACTIVE,
        notes: data.notes,
      },
    });
    alumni.push(alum);
  }

  console.log('✅ Alumni created');

  // Create Alumni Careers
  const careerHistory = [
    {
      alumniIdx: 0,
      careers: [
        {
          company: 'PT Startup Indonesia',
          position: 'Junior Developer',
          startDate: new Date('2020-07-01'),
          endDate: new Date('2022-06-30'),
          isCurrent: false,
        },
        {
          company: 'PT Telkom Indonesia',
          position: 'Software Engineer',
          startDate: new Date('2022-07-01'),
          endDate: null,
          isCurrent: true,
        },
      ],
    },
    {
      alumniIdx: 2,
      careers: [
        {
          company: 'RSUD Sukabumi',
          position: 'Dokter Muda',
          startDate: new Date('2021-06-01'),
          endDate: new Date('2023-05-31'),
          isCurrent: false,
        },
        {
          company: 'RS Islam Jakarta',
          position: 'Dokter',
          startDate: new Date('2023-06-01'),
          endDate: null,
          isCurrent: true,
        },
      ],
    },
    {
      alumniIdx: 3,
      careers: [
        {
          company: 'CV Berkah Jaya',
          position: 'Founder',
          startDate: new Date('2022-01-01'),
          endDate: null,
          isCurrent: true,
        },
      ],
    },
  ];

  let totalCareers = 0;
  for (const hist of careerHistory) {
    for (const career of hist.careers) {
      await prisma.alumniCareer.create({
        data: {
          alumniId: alumni[hist.alumniIdx].id,
          company: career.company,
          position: career.position,
          startDate: career.startDate,
          endDate: career.endDate,
          isCurrent: career.isCurrent,
          description: `Bekerja sebagai ${career.position} di ${career.company}`,
        },
      });
      totalCareers++;
    }
  }

  console.log('✅ Alumni careers created');

  // Create Alumni Education
  const educationHistory = [
    {
      alumniIdx: 0,
      education: [
        {
          institution: 'Universitas Indonesia',
          degree: 'S1',
          field: 'Teknik Informatika',
          startYear: 2020,
          endYear: 2024,
        },
      ],
    },
    {
      alumniIdx: 2,
      education: [
        {
          institution: 'Universitas Airlangga',
          degree: 'S1',
          field: 'Kedokteran Umum',
          startYear: 2021,
          endYear: 2027,
        },
      ],
    },
    {
      alumniIdx: 7,
      education: [
        {
          institution: 'Universitas Indonesia',
          degree: 'S1',
          field: 'Ekonomi',
          startYear: 2023,
          endYear: null,
        },
      ],
    },
  ];

  let totalEducation = 0;
  for (const hist of educationHistory) {
    for (const edu of hist.education) {
      await prisma.alumniEducation.create({
        data: {
          alumniId: alumni[hist.alumniIdx].id,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startYear: edu.startYear,
          endYear: edu.endYear,
          isCompleted: edu.endYear !== null,
        },
      });
      totalEducation++;
    }
  }

  console.log('✅ Alumni education created');

  // Create Alumni Donations
  const donationsData = [
    {
      alumniIdx: 0,
      type: DonationType.MONETARY,
      amount: 5000000,
      description: 'Donasi pembangunan musholla',
    },
    {
      alumniIdx: 2,
      type: DonationType.MONETARY,
      amount: 10000000,
      description: 'Donasi beasiswa santri kurang mampu',
    },
    {
      alumniIdx: 3,
      type: DonationType.GOODS,
      amount: 2000000,
      description: 'Sumbangan buku pelajaran',
    },
    {
      alumniIdx: 4,
      type: DonationType.SERVICE,
      amount: 0,
      description: 'Mengajar tahfidz selama 1 bulan',
    },
    { alumniIdx: 0, type: DonationType.MONETARY, amount: 3000000, description: 'Donasi Ramadhan' },
    {
      alumniIdx: 2,
      type: DonationType.MONETARY,
      amount: 5000000,
      description: 'Donasi kurban',
      isAnonymous: true,
    },
  ];

  for (let idx = 0; idx < donationsData.length; idx++) {
    const don = donationsData[idx];
    await prisma.alumniDonation.create({
      data: {
        alumniId: alumni[don.alumniIdx].id,
        unitId: pesantren.id,
        type: don.type,
        amount: don.amount ? new Prisma.Decimal(don.amount) : null,
        description: don.description,
        donatedAt: new Date(2024, idx, 15),
        receiptNo: `DON-2024-${String(idx + 1).padStart(4, '0')}`,
        isAnonymous: don.isAnonymous || false,
      },
    });
  }

  console.log('✅ Alumni donations created');

  // Create Alumni Events
  const eventsData = [
    {
      type: AlumniEventType.REUNION,
      name: 'Reuni Akbar Alumni 2024',
      description: 'Reuni tahunan seluruh alumni Pondok Pesantren Al-Hikmah',
      eventDate: new Date('2024-08-17'),
      location: 'Aula Utama PP Al-Hikmah',
      capacity: 500,
      status: 'completed',
    },
    {
      type: AlumniEventType.CHARITY,
      name: 'Bakti Sosial Alumni',
      description: 'Kegiatan bakti sosial alumni untuk masyarakat sekitar',
      eventDate: new Date('2024-12-15'),
      location: 'Desa Cipansor',
      capacity: 100,
      status: 'upcoming',
    },
    {
      type: AlumniEventType.SEMINAR,
      name: 'Seminar Karir untuk Santri',
      description: 'Sharing session dari alumni sukses untuk santri',
      eventDate: new Date('2025-01-20'),
      location: 'Gedung Serba Guna',
      capacity: 200,
      status: 'upcoming',
    },
    {
      type: AlumniEventType.GATHERING,
      name: 'Halal Bihalal Alumni 1445 H',
      description: 'Silaturahmi pasca lebaran',
      eventDate: new Date('2024-04-28'),
      location: 'Masjid PP Al-Hikmah',
      capacity: 300,
      status: 'completed',
    },
  ];

  const events = [];
  for (let idx = 0; idx < eventsData.length; idx++) {
    const evt = eventsData[idx];
    const event = await prisma.alumniEvent.create({
      data: {
        unitId: pesantren.id,
        type: evt.type,
        name: evt.name,
        description: evt.description,
        eventDate: evt.eventDate,
        location: evt.location,
        capacity: evt.capacity,
        status: evt.status,
        isPublic: true,
      },
    });
    events.push(event);
  }

  console.log('✅ Alumni events created');

  // Create Alumni Event Attendees
  const attendeeData = [
    { eventIdx: 0, alumniIdxs: [0, 1, 2, 3, 4, 5], status: 'attended' },
    { eventIdx: 1, alumniIdxs: [0, 2, 4], status: 'registered' },
    { eventIdx: 2, alumniIdxs: [0, 1, 2, 3], status: 'registered' },
    { eventIdx: 3, alumniIdxs: [0, 1, 2, 3, 4, 5, 6, 7], status: 'attended' },
  ];

  let totalAttendees = 0;
  for (const att of attendeeData) {
    for (const alumniIdx of att.alumniIdxs) {
      await prisma.alumniEventAttendee.create({
        data: {
          eventId: events[att.eventIdx].id,
          alumniId: alumni[alumniIdx].id,
          status: att.status,
          attendedAt: att.status === 'attended' ? events[att.eventIdx].eventDate : null,
        },
      });
      totalAttendees++;
    }
  }

  console.log('✅ Alumni event attendees created');

  // ============================================
  // SEED SUMMARY
  // ============================================

  console.log('\n📊 Seed Summary:');
  console.log(`   Foundation: 1`);
  console.log(`   Board Members: ${boardMembersData.length}`);
  console.log(`   Units: 4`);
  console.log(`   Roles: 24`);
  console.log(`   Users: ${students.length + 15 + staffData.length + 1}`); // +1 for System User
  console.log(`   Staff: ${staffData.length}`);
  console.log(`   Students: ${students.length}`);
  console.log(`   Classes: 2`);
  console.log(`   Enrollments: 2`);
  console.log(`   Attendance: ${students.length}`);
  console.log(`   Tahfidz: 3`);
  console.log(`   Dormitories: 2`);
  console.log(`   Rooms: 9`);
  console.log(`   Room Assignments: ${students.length}`);
  console.log(`   Permits: 4`);
  console.log(`   Violations: 4`);
  console.log(`   Rewards: 4`);
  console.log(`   Payment Types: ${paymentTypesData.length}`);
  console.log(`   Invoices: 9`);
  console.log(`   Payments: 6`);
  console.log(`   Staff Attendance: ${staffData.length * 7}`);
  console.log(`   Leave Requests: ${leaveData.length}`);
  console.log(`   Admission Periods: 2`);
  console.log(`   Registrants: ${registrantData.length}`);
  console.log(`   Book Categories: ${bookCategoriesData.length}`);
  console.log(`   Books: ${booksData.length}`);
  console.log(`   Borrowings: ${borrowingsData.length}`);
  console.log(`   Medications: ${medicationsData.length}`);
  console.log(`   Medical Records: ${medicalRecordsData.length}`);
  console.log(`   Medication Usages: 3`);
  console.log(`   Asset Categories: ${assetCategoriesData.length}`);
  console.log(`   Assets: ${assetsData.length}`);
  console.log(`   Asset Maintenance: ${maintenanceData.length}`);
  console.log(`   Announcements: ${announcementsData.length}`);
  console.log(`   Notifications: ${students.length * 2}`);
  console.log(`   Subjects: ${subjectsData.length}`);
  console.log(`   Teacher Subjects: 4`);
  console.log(`   Schedules: ${schedulesData.length}`);
  console.log(`   Lesson Plans: ${lessonPlansData.length}`);
  console.log(`   Exams: ${examsData.length}`);
  console.log(`   Grades: ${examsData.length * students.length}`);
  console.log(`   Report Cards: 3`);
  console.log(`   Alumni: ${alumniData.length}`);
  console.log(`   Alumni Careers: ${totalCareers}`);
  console.log(`   Alumni Education: ${totalEducation}`);
  console.log(`   Alumni Donations: ${donationsData.length}`);
  console.log(`   Alumni Events: ${eventsData.length}`);
  console.log(`   Event Attendees: ${totalAttendees}`);

  console.log('\n🔑 Login Credentials:');
  console.log('\n   === SUPER ADMIN (GLOBAL) ===');
  console.log('   Super Admin: superadmin@cipansor.id / SuperAdmin123!');

  console.log('\n   === YAYASAN ===');
  console.log('   Ketua Yayasan: ketua@cipansor.id / Ketua123!');
  console.log('   Pembina Yayasan: pembina@cipansor.id / Pembina123!');
  console.log('   Pengawas Yayasan: pengawas@cipansor.id / Pengawas123!');

  console.log('\n   === PAUD ===');
  console.log('   Admin PAUD: admin@paud.sch.id / Admin123!');
  console.log('   Siswa PAUD: student4@paud.sch.id / Student123!');

  console.log('\n   === SD IT ===');
  console.log('   Admin SD IT: admin@sdit.sch.id / Admin123!');
  console.log('   Kepala Sekolah SD IT: kepala@sdit.sch.id / Kepala123!');
  console.log('   Guru SD IT: fatimah@sdit.sch.id / Teacher123!');
  console.log('   Orang Tua SD IT: parent3@sdit.sch.id / Parent123!');
  console.log('   Siswa SD IT: student3@sdit.sch.id / Student123!');

  console.log('\n   === SMP IT ===');
  console.log('   Admin SMP IT: admin@smpit.sch.id / Admin123!');
  console.log('   Kepala Sekolah SMP IT: kepala@smpit.sch.id / Kepala123!');
  console.log('   Guru SMP IT: ahmad@smpit.sch.id / Teacher123!');
  console.log('   Orang Tua SMP IT: parent1@smpit.sch.id / Parent123!');
  console.log('   Siswa SMP IT: student1@smpit.sch.id / Student123!');

  console.log("\n   === SMA AL-QUR'AN ===");
  console.log("   Admin SMA Al-Qur'an: admin@smaq.sch.id / Admin123!");
  console.log("   Siswa SMA Al-Qur'an: student5@smaq.sch.id / Student123!");

  // ============================================
  // PHASE 9: PAUD Enhancement Seeds
  // ============================================
  await seedPAUDIndicators(prisma);
  await seedImmunizationReference(prisma);

  // ============================================
  // E2E: deterministic 2FA for admin accounts
  // ============================================
  // Admins/super-admins are forced through a 2FA gate on login. For local e2e
  // (and deterministic manual testing) we can pre-enable 2FA with a FIXED secret
  // so a valid TOTP can be generated offline. Opt-in via E2E_FIXED_2FA=1 so the
  // fixed secret never lands in a real environment's seed.
  if (process.env.E2E_FIXED_2FA === '1') {
    const fixedSecret = process.env.E2E_2FA_SECRET || 'NTGHH5U5LDHIYARFFNGFQKQHARJU7GBE';
    const updated = await prisma.user.updateMany({
      where: { role: { in: [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN] } },
      data: { isTwoFactorEnabled: true, twoFactorSecret: fixedSecret, twoFactorSecretPending: null },
    });
    console.log(`🔐 [E2E] Pre-enabled 2FA on ${updated.count} admin account(s) with a fixed secret`);
  }

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
