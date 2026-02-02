// User Roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  UNIT_ADMIN = "UNIT_ADMIN",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  STAFF = "STAFF",
}

// Role Codes (Detailed)
export enum RoleCode {
  // Global
  SUPER_ADMIN = "SUPER_ADMIN",

  // Yayasan roles
  YAYASAN_ADMIN = "YAYASAN_ADMIN",
  YAYASAN_PEMBINA = "YAYASAN_PEMBINA",
  YAYASAN_KETUA = "YAYASAN_KETUA",
  YAYASAN_SEKRETARIS = "YAYASAN_SEKRETARIS",
  YAYASAN_BENDAHARA = "YAYASAN_BENDAHARA",
  YAYASAN_ANGGOTA = "YAYASAN_ANGGOTA",
  YAYASAN_PENGAWAS = "YAYASAN_PENGAWAS",

  // TK Qur'an roles
  TKQ_ADMIN = "TKQ_ADMIN",
  TKQ_KEPALA_SEKOLAH = "TKQ_KEPALA_SEKOLAH",
  TKQ_GURU = "TKQ_GURU",
  TKQ_TATA_USAHA = "TKQ_TATA_USAHA",
  TKQ_ORANG_TUA = "TKQ_ORANG_TUA",
  TKQ_SISWA = "TKQ_SISWA",

  // SD IT (Islam Terpadu) roles
  SDIT_ADMIN = "SDIT_ADMIN",
  SDIT_KEPALA_SEKOLAH = "SDIT_KEPALA_SEKOLAH",
  SDIT_GURU = "SDIT_GURU",
  SDIT_TATA_USAHA = "SDIT_TATA_USAHA",
  SDIT_ORANG_TUA = "SDIT_ORANG_TUA",
  SDIT_SISWA = "SDIT_SISWA",

  // SMP IT (Islam Terpadu) roles
  SMPIT_ADMIN = "SMPIT_ADMIN",
  SMPIT_KEPALA_SEKOLAH = "SMPIT_KEPALA_SEKOLAH",
  SMPIT_GURU = "SMPIT_GURU",
  SMPIT_TATA_USAHA = "SMPIT_TATA_USAHA",
  SMPIT_ORANG_TUA = "SMPIT_ORANG_TUA",
  SMPIT_SISWA = "SMPIT_SISWA",

  // SMA Qur'an roles
  SMAQ_ADMIN = "SMAQ_ADMIN",
  SMAQ_KEPALA_SEKOLAH = "SMAQ_KEPALA_SEKOLAH",
  SMAQ_GURU = "SMAQ_GURU",
  SMAQ_TATA_USAHA = "SMAQ_TATA_USAHA",
  SMAQ_ORANG_TUA = "SMAQ_ORANG_TUA",
  SMAQ_SISWA = "SMAQ_SISWA",

  // Pesantren roles (cross-unit)
  MUSYRIF = "MUSYRIF",
  MUHAFIDZ = "MUHAFIDZ",
  MURABBI = "MURABBI",
  WALI_KAMAR = "WALI_KAMAR",
}

// Unit Types
export enum UnitType {
  PESANTREN = "PESANTREN",
  PAUD = "PAUD",
  SD_IT = "SD_IT",
  SMP_IT = "SMP_IT",
  SMA_QURAN = "SMA_QURAN",
  TK_QURAN = "TK_QURAN",
  OTHER = "OTHER",
}

// Gender
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

// Semester
export enum Semester {
  ODD = "ODD",
  EVEN = "EVEN",
}

// Day of Week
export enum DayOfWeek {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

// Attendance Status
export enum AttendanceStatus {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  SICK = "SICK",
  EXCUSED = "EXCUSED",
}

// Memorization Quality
export enum MemorizationQuality {
  LANCAR = "LANCAR",
  KURANG_LANCAR = "KURANG_LANCAR",
  ULANG = "ULANG",
}

// Book Status
export enum BookStatus {
  AVAILABLE = "AVAILABLE",
  BORROWED = "BORROWED",
  RESERVED = "RESERVED",
  MAINTENANCE = "MAINTENANCE",
  LOST = "LOST",
}

// Borrowing Status
export enum BorrowingStatus {
  ACTIVE = "ACTIVE",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE",
  LOST = "LOST",
}

// Enrollment Status
export enum EnrollmentStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  TRANSFERRED = "transferred",
  DROPPED = "dropped",
}

// Complaint Category
export enum ComplaintCategory {
  ACADEMIC = "ACADEMIC",
  FACILITY = "FACILITY",
  SERVICE = "SERVICE",
  BULLYING = "BULLYING",
  FINANCE = "FINANCE",
  OTHER = "OTHER",
}

// Complaint Status
export enum ComplaintStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  REJECTED = "REJECTED",
}
