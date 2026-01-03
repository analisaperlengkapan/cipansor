// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UNIT_ADMIN = 'UNIT_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

// Unit Types
export enum UnitType {
  PESANTREN = 'PESANTREN',
  PAUD = 'PAUD',
  SD_IT = 'SD_IT',
  SMP_IT = 'SMP_IT',
  SMA_QURAN = 'SMA_QURAN',
  TK_QURAN = 'TK_QURAN', // Added to match likely Prisma schema if divergent
  OTHER = 'OTHER',
}

// Gender
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

// Semester
export enum Semester {
  ODD = 'ODD',
  EVEN = 'EVEN',
}

// Attendance Status
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  SICK = 'SICK',
  EXCUSED = 'EXCUSED', // Prisma uses EXCUSED, Shared used PERMISSION. Aligned to Prisma.
}

// Memorization Quality
export enum MemorizationQuality {
  LANCAR = 'LANCAR',
  KURANG_LANCAR = 'KURANG_LANCAR',
  ULANG = 'ULANG',
}
