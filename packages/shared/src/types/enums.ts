// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  UNIT_ADMIN = 'UNIT_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  STAFF = 'STAFF',
}

// Unit Types
export enum UnitType {
  PESANTREN = 'PESANTREN',
  PAUD = 'PAUD',
  SD_IT = 'SD_IT',
  SMP_IT = 'SMP_IT',
  SMA_QURAN = 'SMA_QURAN',
  TK_QURAN = 'TK_QURAN',
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

// Day of Week
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// Attendance Status
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  SICK = 'SICK',
  EXCUSED = 'EXCUSED',
}

// Memorization Quality
export enum MemorizationQuality {
  LANCAR = 'LANCAR',
  KURANG_LANCAR = 'KURANG_LANCAR',
  ULANG = 'ULANG',
}

// Book Status
export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  RESERVED = 'RESERVED',
  MAINTENANCE = 'MAINTENANCE',
  LOST = 'LOST',
}

// Borrowing Status
export enum BorrowingStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
  LOST = 'LOST',
}

// Enrollment Status
export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TRANSFERRED = 'transferred',
  DROPPED = 'dropped',
}
