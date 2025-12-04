-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER', 'STAFF', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "Realm" AS ENUM ('GLOBAL', 'YAYASAN', 'PAUD', 'SD_IT', 'SMP_IT', 'SMA_ALQURAN');

-- CreateEnum
CREATE TYPE "RoleCode" AS ENUM ('SUPER_ADMIN', 'YAYASAN_ADMIN', 'YAYASAN_PEMBINA', 'YAYASAN_KETUA', 'YAYASAN_SEKRETARIS', 'YAYASAN_BENDAHARA', 'YAYASAN_ANGGOTA', 'YAYASAN_PENGAWAS', 'PAUD_ADMIN', 'PAUD_KEPALA_SEKOLAH', 'PAUD_GURU', 'PAUD_TATA_USAHA', 'PAUD_ORANG_TUA', 'PAUD_SISWA', 'SDIT_ADMIN', 'SDIT_KEPALA_SEKOLAH', 'SDIT_GURU', 'SDIT_TATA_USAHA', 'SDIT_ORANG_TUA', 'SDIT_SISWA', 'SMPIT_ADMIN', 'SMPIT_KEPALA_SEKOLAH', 'SMPIT_GURU', 'SMPIT_TATA_USAHA', 'SMPIT_ORANG_TUA', 'SMPIT_SISWA', 'SMAQ_ADMIN', 'SMAQ_KEPALA_SEKOLAH', 'SMAQ_GURU', 'SMAQ_TATA_USAHA', 'SMAQ_ORANG_TUA', 'SMAQ_SISWA');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PESANTREN', 'PAUD', 'TK', 'SD_IT', 'SMP_IT', 'SMA_QURAN', 'OTHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'SICK', 'EXCUSED');

-- CreateEnum
CREATE TYPE "TahfidzActivityType" AS ENUM ('ZIYADAH', 'MUROJAAH', 'TASMI', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "PermitType" AS ENUM ('PULANG', 'KELUAR', 'SAKIT', 'KELUARGA', 'OTHER');

-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('MINOR', 'MODERATE', 'MAJOR');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'EWALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('REGISTERED', 'DOCUMENT_CHECK', 'TEST_SCHEDULED', 'TEST_COMPLETED', 'ACCEPTED', 'REJECTED', 'ENROLLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'MARRIAGE', 'BEREAVEMENT', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StaffAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'SICK', 'LEAVE', 'REMOTE', 'DUTY');

-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'RESERVED', 'MAINTENANCE', 'LOST');

-- CreateEnum
CREATE TYPE "BorrowingStatus" AS ENUM ('ACTIVE', 'RETURNED', 'OVERDUE', 'LOST');

-- CreateEnum
CREATE TYPE "MedicalRecordType" AS ENUM ('CHECKUP', 'ILLNESS', 'INJURY', 'FIRST_AID', 'REFERRAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ANNOUNCEMENT', 'REMINDER', 'ALERT', 'PAYMENT', 'ACADEMIC');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'DAMAGED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'BROKEN');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('ACADEMIC', 'RELIGIOUS', 'TAHFIDZ', 'EXTRACURRICULAR');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('DAILY_TEST', 'QUIZ', 'MIDTERM', 'FINAL', 'PRACTICAL', 'PROJECT', 'TAHFIDZ_TEST');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'GRADED');

-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('EXAM', 'ASSIGNMENT', 'PARTICIPATION', 'ATTENDANCE', 'PROJECT', 'TAHFIDZ');

-- CreateEnum
CREATE TYPE "AlumniStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECEASED');

-- CreateEnum
CREATE TYPE "DonationType" AS ENUM ('MONETARY', 'GOODS', 'SERVICE', 'SCHOLARSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "AlumniEventType" AS ENUM ('REUNION', 'SEMINAR', 'WORKSHOP', 'GATHERING', 'CHARITY', 'OTHER');

-- CreateEnum
CREATE TYPE "TakhosusStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "HalaqohDay" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "MuhasabahMood" AS ENUM ('EXCELLENT', 'GOOD', 'NEUTRAL', 'LOW', 'STRUGGLING');

-- CreateEnum
CREATE TYPE "PublicDonationType" AS ENUM ('INFAK', 'INFAK_BULANAN', 'ZAKAT_MAAL', 'ZAKAT_FITRAH', 'WAKAF', 'SEDEKAH_JARIYAH', 'PEMBANGUNAN', 'BEASISWA', 'OTHERS');

-- CreateEnum
CREATE TYPE "DonationPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'QRIS', 'EWALLET', 'OTHERS');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'VERIFIED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "WaveStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED', 'FULL');

-- CreateTable
CREATE TABLE "foundations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "founding_date" TIMESTAMP(3),
    "tax_id" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "vision" TEXT,
    "mission" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL,
    "unit_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "foundation_id" TEXT,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "npsn" TEXT,
    "accreditation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "nip" TEXT,
    "nuptk" TEXT,
    "specialization" TEXT,
    "join_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "nip" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "join_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "homeroom_teacher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "nis" TEXT NOT NULL,
    "nisn" TEXT,
    "gender" "Gender" NOT NULL,
    "birth_place" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "parent_name" TEXT NOT NULL,
    "parent_phone" TEXT NOT NULL,
    "parent_email" TEXT,
    "photo_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "entry_year" INTEGER,
    "graduate_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahfidz_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "activity_type" "TahfidzActivityType" NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "surah_name" TEXT NOT NULL,
    "ayah_start" INTEGER NOT NULL,
    "ayah_end" INTEGER NOT NULL,
    "juz" INTEGER NOT NULL,
    "total_ayah" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahfidz_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tahfidz_targets" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "target_juz" INTEGER NOT NULL,
    "target_ayah" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tahfidz_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dormitories" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "dormitories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "dormitory_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_assignments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permits" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "PermitType" NOT NULL,
    "reason" TEXT NOT NULL,
    "destination" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "PermitStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_note" TEXT,
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "ViolationType" NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "action" TEXT,
    "reported_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "given_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "given_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_types" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "payment_type_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "period" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "reference_no" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_members" (
    "id" TEXT NOT NULL,
    "foundation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "photo_url" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_documents" (
    "id" TEXT NOT NULL,
    "foundation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "document_no" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "file_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foundation_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_periods" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "quota" INTEGER NOT NULL DEFAULT 0,
    "registration_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrants" (
    "id" TEXT NOT NULL,
    "admission_period_id" TEXT NOT NULL,
    "wave_id" TEXT,
    "registration_no" TEXT NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "gender" "Gender" NOT NULL,
    "birth_place" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "previous_school" TEXT,
    "quran_ability" TEXT,
    "memorized_juz" INTEGER,
    "parent_name" TEXT NOT NULL,
    "parent_phone" TEXT NOT NULL,
    "parent_email" TEXT,
    "parent_occupation" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'REGISTERED',
    "test_score" DECIMAL(5,2),
    "interview_score" DECIMAL(5,2),
    "tahfidz_score" DECIMAL(5,2),
    "notes" TEXT,
    "accepted_at" TIMESTAMP(3),
    "enrolled_at" TIMESTAMP(3),
    "student_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrant_documents" (
    "id" TEXT NOT NULL,
    "registrant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "StaffAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" "RoleCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "realm" "Realm" NOT NULL,
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_categories" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publisher" TEXT,
    "publish_year" INTEGER,
    "language" TEXT NOT NULL DEFAULT 'Indonesia',
    "page_count" INTEGER,
    "shelf_location" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "available" INTEGER NOT NULL DEFAULT 1,
    "cover_url" TEXT,
    "description" TEXT,
    "status" "BookStatus" NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "borrowings" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "borrower_type" TEXT NOT NULL,
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "status" "BorrowingStatus" NOT NULL DEFAULT 'ACTIVE',
    "late_fee" DECIMAL(10,2),
    "notes" TEXT,
    "processed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "borrowings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "MedicalRecordType" NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "complaint" TEXT NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "prescription" TEXT,
    "notes" TEXT,
    "referred_to" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "follow_up_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT,
    "type" TEXT NOT NULL,
    "dosage_form" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 10,
    "expiry_date" TIMESTAMP(3),
    "supplier" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_usage_logs" (
    "id" TEXT NOT NULL,
    "medication_id" TEXT NOT NULL,
    "student_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "given_by_id" TEXT NOT NULL,
    "given_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medication_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'ANNOUNCEMENT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "attachment_url" TEXT,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "target_roles" TEXT[],
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "purchase_date" TIMESTAMP(3),
    "purchase_price" DECIMAL(15,2),
    "supplier" TEXT,
    "location" TEXT,
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "warranty_expiry" TIMESTAMP(3),
    "notes" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_maintenance" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(15,2),
    "vendor" TEXT,
    "performed_by" TEXT NOT NULL,
    "next_schedule" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "level" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "materials" TEXT,
    "activities" TEXT,
    "assessment" TEXT,
    "resources" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 45,
    "planned_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "type" "ExamType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "max_score" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "passing_score" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "exam_id" TEXT,
    "academic_year_id" TEXT NOT NULL,
    "type" "GradeType" NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "percentage" DECIMAL(5,2),
    "letter_grade" TEXT,
    "notes" TEXT,
    "graded_by_id" TEXT NOT NULL,
    "graded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "total_score" DECIMAL(5,2),
    "average_score" DECIMAL(5,2),
    "rank" INTEGER,
    "total_students" INTEGER,
    "attendance" JSONB,
    "tahfidz_summary" JSONB,
    "teacher_notes" TEXT,
    "principal_notes" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_card_details" (
    "id" TEXT NOT NULL,
    "report_card_id" TEXT NOT NULL,
    "subject_name" TEXT NOT NULL,
    "daily_score" DECIMAL(5,2),
    "midterm_score" DECIMAL(5,2),
    "final_score" DECIMAL(5,2),
    "average_score" DECIMAL(5,2),
    "letter_grade" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_card_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni" (
    "id" TEXT NOT NULL,
    "student_id" TEXT,
    "unit_id" TEXT NOT NULL,
    "registration_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birth_place" TEXT,
    "birth_date" TIMESTAMP(3),
    "graduation_year" INTEGER NOT NULL,
    "graduation_date" TIMESTAMP(3),
    "last_class" TEXT,
    "tahfidz_level" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT DEFAULT 'Indonesia',
    "photo" TEXT,
    "status" "AlumniStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "alumni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_careers" (
    "id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_educations" (
    "id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "location" TEXT,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "achievements" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_donations" (
    "id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "type" "DonationType" NOT NULL,
    "amount" DECIMAL(15,2),
    "description" TEXT NOT NULL,
    "purpose" TEXT,
    "donated_at" TIMESTAMP(3) NOT NULL,
    "receipt_no" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_events" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "type" "AlumniEventType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "capacity" INTEGER,
    "fee" DECIMAL(12,2),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "organizer" TEXT,
    "contact" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "alumni_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alumni_event_attendees" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "attended_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "halaqoh" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 15,
    "schedule_day" "HalaqohDay"[],
    "schedule_time" TEXT,
    "location" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "halaqoh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "takhosus_enrollments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "halaqoh_id" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TakhosusStatus" NOT NULL DEFAULT 'ACTIVE',
    "target_juz" INTEGER NOT NULL DEFAULT 30,
    "target_completion_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_juz" INTEGER NOT NULL DEFAULT 0,
    "current_juz" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "takhosus_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanad_records" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "juz" INTEGER NOT NULL,
    "surah_start" INTEGER,
    "surah_end" INTEGER,
    "certified_at" TIMESTAMP(3) NOT NULL,
    "grade" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sanad_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_muhasabah" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sholat_subuh" BOOLEAN NOT NULL DEFAULT false,
    "sholat_dzuhur" BOOLEAN NOT NULL DEFAULT false,
    "sholat_ashar" BOOLEAN NOT NULL DEFAULT false,
    "sholat_maghrib" BOOLEAN NOT NULL DEFAULT false,
    "sholat_isya" BOOLEAN NOT NULL DEFAULT false,
    "sholat_tahajud" BOOLEAN NOT NULL DEFAULT false,
    "sholat_dhuha" BOOLEAN NOT NULL DEFAULT false,
    "sholat_rawatib" INTEGER NOT NULL DEFAULT 0,
    "puasa_sunnah" BOOLEAN NOT NULL DEFAULT false,
    "tilawah_pages" INTEGER NOT NULL DEFAULT 0,
    "tilawah_juz" INTEGER,
    "dzikir_pagi" BOOLEAN NOT NULL DEFAULT false,
    "dzikir_sore" BOOLEAN NOT NULL DEFAULT false,
    "istighfar" INTEGER NOT NULL DEFAULT 0,
    "shalawat" INTEGER NOT NULL DEFAULT 0,
    "murojaah_juz" INTEGER,
    "murojaah_pages" INTEGER NOT NULL DEFAULT 0,
    "ziyadah_ayat" INTEGER NOT NULL DEFAULT 0,
    "sedekah" BOOLEAN NOT NULL DEFAULT false,
    "membantu_orang_tua" BOOLEAN NOT NULL DEFAULT false,
    "berbaik_ke_teman" BOOLEAN NOT NULL DEFAULT false,
    "mood" "MuhasabahMood" NOT NULL DEFAULT 'NEUTRAL',
    "gratitude" TEXT,
    "improvement" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_muhasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation_campaigns" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "collected_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "donor_count" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "image_url" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "donation_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "unit_id" TEXT,
    "donor_name" TEXT NOT NULL,
    "donor_phone" TEXT,
    "donor_email" TEXT,
    "donor_address" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "type" "PublicDonationType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "DonationPaymentMethod" NOT NULL,
    "payment_proof" TEXT,
    "receipt_number" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "purpose" TEXT,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "notes" TEXT,
    "donated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_waves" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "wave_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "quota" INTEGER NOT NULL,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "accepted_count" INTEGER NOT NULL DEFAULT 0,
    "status" "WaveStatus" NOT NULL DEFAULT 'UPCOMING',
    "registration_fee" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_waves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_unit_id_idx" ON "users"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "units_npsn_key" ON "units"("npsn");

-- CreateIndex
CREATE INDEX "units_type_idx" ON "units"("type");

-- CreateIndex
CREATE INDEX "units_foundation_id_idx" ON "units"("foundation_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_user_id_key" ON "teachers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_nip_key" ON "teachers"("nip");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_nuptk_key" ON "teachers"("nuptk");

-- CreateIndex
CREATE INDEX "teachers_unit_id_idx" ON "teachers"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_nip_key" ON "staff"("nip");

-- CreateIndex
CREATE INDEX "staff_unit_id_idx" ON "staff"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE INDEX "academic_years_is_active_idx" ON "academic_years"("is_active");

-- CreateIndex
CREATE INDEX "classes_level_idx" ON "classes"("level");

-- CreateIndex
CREATE UNIQUE INDEX "classes_unit_id_academic_year_id_name_key" ON "classes"("unit_id", "academic_year_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_nis_key" ON "students"("nis");

-- CreateIndex
CREATE INDEX "students_nis_idx" ON "students"("nis");

-- CreateIndex
CREATE INDEX "students_unit_id_idx" ON "students"("unit_id");

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "student_parents_parent_id_idx" ON "student_parents"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_parents_student_id_parent_id_key" ON "student_parents"("student_id", "parent_id");

-- CreateIndex
CREATE INDEX "class_enrollments_status_idx" ON "class_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "class_enrollments_student_id_class_id_key" ON "class_enrollments"("student_id", "class_id");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_student_id_class_id_date_key" ON "attendances"("student_id", "class_id", "date");

-- CreateIndex
CREATE INDEX "tahfidz_records_student_id_idx" ON "tahfidz_records"("student_id");

-- CreateIndex
CREATE INDEX "tahfidz_records_activity_type_idx" ON "tahfidz_records"("activity_type");

-- CreateIndex
CREATE INDEX "tahfidz_records_surah_number_idx" ON "tahfidz_records"("surah_number");

-- CreateIndex
CREATE INDEX "tahfidz_records_juz_idx" ON "tahfidz_records"("juz");

-- CreateIndex
CREATE UNIQUE INDEX "tahfidz_targets_student_id_academic_year_id_key" ON "tahfidz_targets"("student_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "dormitories_code_key" ON "dormitories"("code");

-- CreateIndex
CREATE INDEX "dormitories_unit_id_idx" ON "dormitories"("unit_id");

-- CreateIndex
CREATE INDEX "dormitories_gender_idx" ON "dormitories"("gender");

-- CreateIndex
CREATE INDEX "rooms_is_active_idx" ON "rooms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_dormitory_id_name_key" ON "rooms"("dormitory_id", "name");

-- CreateIndex
CREATE INDEX "room_assignments_student_id_idx" ON "room_assignments"("student_id");

-- CreateIndex
CREATE INDEX "room_assignments_room_id_idx" ON "room_assignments"("room_id");

-- CreateIndex
CREATE INDEX "room_assignments_is_active_idx" ON "room_assignments"("is_active");

-- CreateIndex
CREATE INDEX "permits_student_id_idx" ON "permits"("student_id");

-- CreateIndex
CREATE INDEX "permits_status_idx" ON "permits"("status");

-- CreateIndex
CREATE INDEX "permits_start_date_end_date_idx" ON "permits"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "violations_student_id_idx" ON "violations"("student_id");

-- CreateIndex
CREATE INDEX "violations_type_idx" ON "violations"("type");

-- CreateIndex
CREATE INDEX "violations_occurred_at_idx" ON "violations"("occurred_at");

-- CreateIndex
CREATE INDEX "rewards_student_id_idx" ON "rewards"("student_id");

-- CreateIndex
CREATE INDEX "rewards_category_idx" ON "rewards"("category");

-- CreateIndex
CREATE INDEX "rewards_given_at_idx" ON "rewards"("given_at");

-- CreateIndex
CREATE INDEX "payment_types_is_active_idx" ON "payment_types"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "payment_types_unit_id_code_key" ON "payment_types"("unit_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_student_id_idx" ON "invoices"("student_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_paid_at_idx" ON "payments"("paid_at");

-- CreateIndex
CREATE INDEX "board_members_foundation_id_idx" ON "board_members"("foundation_id");

-- CreateIndex
CREATE INDEX "board_members_is_active_idx" ON "board_members"("is_active");

-- CreateIndex
CREATE INDEX "foundation_documents_foundation_id_idx" ON "foundation_documents"("foundation_id");

-- CreateIndex
CREATE INDEX "foundation_documents_type_idx" ON "foundation_documents"("type");

-- CreateIndex
CREATE INDEX "admission_periods_unit_id_idx" ON "admission_periods"("unit_id");

-- CreateIndex
CREATE INDEX "admission_periods_academic_year_id_idx" ON "admission_periods"("academic_year_id");

-- CreateIndex
CREATE INDEX "admission_periods_is_active_idx" ON "admission_periods"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "registrants_registration_no_key" ON "registrants"("registration_no");

-- CreateIndex
CREATE UNIQUE INDEX "registrants_student_id_key" ON "registrants"("student_id");

-- CreateIndex
CREATE INDEX "registrants_admission_period_id_idx" ON "registrants"("admission_period_id");

-- CreateIndex
CREATE INDEX "registrants_wave_id_idx" ON "registrants"("wave_id");

-- CreateIndex
CREATE INDEX "registrants_status_idx" ON "registrants"("status");

-- CreateIndex
CREATE INDEX "registrants_registration_no_idx" ON "registrants"("registration_no");

-- CreateIndex
CREATE INDEX "registrant_documents_registrant_id_idx" ON "registrant_documents"("registrant_id");

-- CreateIndex
CREATE INDEX "registrant_documents_type_idx" ON "registrant_documents"("type");

-- CreateIndex
CREATE INDEX "staff_attendance_staff_id_idx" ON "staff_attendance"("staff_id");

-- CreateIndex
CREATE INDEX "staff_attendance_date_idx" ON "staff_attendance"("date");

-- CreateIndex
CREATE INDEX "staff_attendance_status_idx" ON "staff_attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_staff_id_date_key" ON "staff_attendance"("staff_id", "date");

-- CreateIndex
CREATE INDEX "leaves_staff_id_idx" ON "leaves"("staff_id");

-- CreateIndex
CREATE INDEX "leaves_status_idx" ON "leaves"("status");

-- CreateIndex
CREATE INDEX "leaves_start_date_end_date_idx" ON "leaves"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_realm_idx" ON "roles"("realm");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- CreateIndex
CREATE INDEX "user_role_assignments_user_id_idx" ON "user_role_assignments"("user_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_role_id_idx" ON "user_role_assignments"("role_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_unit_id_idx" ON "user_role_assignments"("unit_id");

-- CreateIndex
CREATE INDEX "user_role_assignments_is_primary_idx" ON "user_role_assignments"("is_primary");

-- CreateIndex
CREATE INDEX "user_role_assignments_is_active_idx" ON "user_role_assignments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_id_unit_id_key" ON "user_role_assignments"("user_id", "role_id", "unit_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "book_categories_unit_id_idx" ON "book_categories"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_categories_unit_id_code_key" ON "book_categories"("unit_id", "code");

-- CreateIndex
CREATE INDEX "books_unit_id_idx" ON "books"("unit_id");

-- CreateIndex
CREATE INDEX "books_category_id_idx" ON "books"("category_id");

-- CreateIndex
CREATE INDEX "books_isbn_idx" ON "books"("isbn");

-- CreateIndex
CREATE INDEX "books_title_idx" ON "books"("title");

-- CreateIndex
CREATE INDEX "books_author_idx" ON "books"("author");

-- CreateIndex
CREATE INDEX "borrowings_book_id_idx" ON "borrowings"("book_id");

-- CreateIndex
CREATE INDEX "borrowings_borrower_id_idx" ON "borrowings"("borrower_id");

-- CreateIndex
CREATE INDEX "borrowings_status_idx" ON "borrowings"("status");

-- CreateIndex
CREATE INDEX "borrowings_due_date_idx" ON "borrowings"("due_date");

-- CreateIndex
CREATE INDEX "medical_records_student_id_idx" ON "medical_records"("student_id");

-- CreateIndex
CREATE INDEX "medical_records_visit_date_idx" ON "medical_records"("visit_date");

-- CreateIndex
CREATE INDEX "medical_records_type_idx" ON "medical_records"("type");

-- CreateIndex
CREATE INDEX "medications_unit_id_idx" ON "medications"("unit_id");

-- CreateIndex
CREATE INDEX "medications_name_idx" ON "medications"("name");

-- CreateIndex
CREATE INDEX "medications_expiry_date_idx" ON "medications"("expiry_date");

-- CreateIndex
CREATE INDEX "medication_usage_logs_medication_id_idx" ON "medication_usage_logs"("medication_id");

-- CreateIndex
CREATE INDEX "medication_usage_logs_student_id_idx" ON "medication_usage_logs"("student_id");

-- CreateIndex
CREATE INDEX "medication_usage_logs_given_at_idx" ON "medication_usage_logs"("given_at");

-- CreateIndex
CREATE INDEX "announcements_unit_id_idx" ON "announcements"("unit_id");

-- CreateIndex
CREATE INDEX "announcements_published_at_idx" ON "announcements"("published_at");

-- CreateIndex
CREATE INDEX "announcements_type_idx" ON "announcements"("type");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "asset_categories_code_key" ON "asset_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "assets_code_key" ON "assets"("code");

-- CreateIndex
CREATE INDEX "assets_unit_id_idx" ON "assets"("unit_id");

-- CreateIndex
CREATE INDEX "assets_category_id_idx" ON "assets"("category_id");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_condition_idx" ON "assets"("condition");

-- CreateIndex
CREATE INDEX "asset_maintenance_asset_id_idx" ON "asset_maintenance"("asset_id");

-- CreateIndex
CREATE INDEX "asset_maintenance_maintenance_date_idx" ON "asset_maintenance"("maintenance_date");

-- CreateIndex
CREATE INDEX "subjects_unit_id_idx" ON "subjects"("unit_id");

-- CreateIndex
CREATE INDEX "subjects_type_idx" ON "subjects"("type");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_unit_id_code_key" ON "subjects"("unit_id", "code");

-- CreateIndex
CREATE INDEX "teacher_subjects_teacher_id_idx" ON "teacher_subjects"("teacher_id");

-- CreateIndex
CREATE INDEX "teacher_subjects_subject_id_idx" ON "teacher_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacher_id_subject_id_class_id_key" ON "teacher_subjects"("teacher_id", "subject_id", "class_id");

-- CreateIndex
CREATE INDEX "lesson_plans_subject_id_idx" ON "lesson_plans"("subject_id");

-- CreateIndex
CREATE INDEX "lesson_plans_teacher_id_idx" ON "lesson_plans"("teacher_id");

-- CreateIndex
CREATE INDEX "lesson_plans_class_id_idx" ON "lesson_plans"("class_id");

-- CreateIndex
CREATE INDEX "lesson_plans_planned_date_idx" ON "lesson_plans"("planned_date");

-- CreateIndex
CREATE INDEX "schedules_unit_id_idx" ON "schedules"("unit_id");

-- CreateIndex
CREATE INDEX "schedules_class_id_idx" ON "schedules"("class_id");

-- CreateIndex
CREATE INDEX "schedules_teacher_id_idx" ON "schedules"("teacher_id");

-- CreateIndex
CREATE INDEX "schedules_day_of_week_idx" ON "schedules"("day_of_week");

-- CreateIndex
CREATE INDEX "exams_unit_id_idx" ON "exams"("unit_id");

-- CreateIndex
CREATE INDEX "exams_subject_id_idx" ON "exams"("subject_id");

-- CreateIndex
CREATE INDEX "exams_class_id_idx" ON "exams"("class_id");

-- CreateIndex
CREATE INDEX "exams_scheduled_at_idx" ON "exams"("scheduled_at");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "grades_student_id_idx" ON "grades"("student_id");

-- CreateIndex
CREATE INDEX "grades_subject_id_idx" ON "grades"("subject_id");

-- CreateIndex
CREATE INDEX "grades_exam_id_idx" ON "grades"("exam_id");

-- CreateIndex
CREATE INDEX "grades_academic_year_id_idx" ON "grades"("academic_year_id");

-- CreateIndex
CREATE INDEX "grades_type_idx" ON "grades"("type");

-- CreateIndex
CREATE INDEX "report_cards_student_id_idx" ON "report_cards"("student_id");

-- CreateIndex
CREATE INDEX "report_cards_class_id_idx" ON "report_cards"("class_id");

-- CreateIndex
CREATE INDEX "report_cards_academic_year_id_idx" ON "report_cards"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_cards_student_id_class_id_academic_year_id_semester_key" ON "report_cards"("student_id", "class_id", "academic_year_id", "semester");

-- CreateIndex
CREATE INDEX "report_card_details_report_card_id_idx" ON "report_card_details"("report_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_student_id_key" ON "alumni"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_registration_no_key" ON "alumni"("registration_no");

-- CreateIndex
CREATE INDEX "alumni_unit_id_idx" ON "alumni"("unit_id");

-- CreateIndex
CREATE INDEX "alumni_graduation_year_idx" ON "alumni"("graduation_year");

-- CreateIndex
CREATE INDEX "alumni_status_idx" ON "alumni"("status");

-- CreateIndex
CREATE INDEX "alumni_careers_alumni_id_idx" ON "alumni_careers"("alumni_id");

-- CreateIndex
CREATE INDEX "alumni_educations_alumni_id_idx" ON "alumni_educations"("alumni_id");

-- CreateIndex
CREATE INDEX "alumni_donations_alumni_id_idx" ON "alumni_donations"("alumni_id");

-- CreateIndex
CREATE INDEX "alumni_donations_unit_id_idx" ON "alumni_donations"("unit_id");

-- CreateIndex
CREATE INDEX "alumni_donations_type_idx" ON "alumni_donations"("type");

-- CreateIndex
CREATE INDEX "alumni_donations_donated_at_idx" ON "alumni_donations"("donated_at");

-- CreateIndex
CREATE INDEX "alumni_events_unit_id_idx" ON "alumni_events"("unit_id");

-- CreateIndex
CREATE INDEX "alumni_events_event_date_idx" ON "alumni_events"("event_date");

-- CreateIndex
CREATE INDEX "alumni_events_type_idx" ON "alumni_events"("type");

-- CreateIndex
CREATE INDEX "alumni_events_status_idx" ON "alumni_events"("status");

-- CreateIndex
CREATE INDEX "alumni_event_attendees_event_id_idx" ON "alumni_event_attendees"("event_id");

-- CreateIndex
CREATE INDEX "alumni_event_attendees_alumni_id_idx" ON "alumni_event_attendees"("alumni_id");

-- CreateIndex
CREATE INDEX "alumni_event_attendees_status_idx" ON "alumni_event_attendees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "alumni_event_attendees_event_id_alumni_id_key" ON "alumni_event_attendees"("event_id", "alumni_id");

-- CreateIndex
CREATE UNIQUE INDEX "halaqoh_code_key" ON "halaqoh"("code");

-- CreateIndex
CREATE INDEX "halaqoh_unit_id_idx" ON "halaqoh"("unit_id");

-- CreateIndex
CREATE INDEX "halaqoh_teacher_id_idx" ON "halaqoh"("teacher_id");

-- CreateIndex
CREATE INDEX "halaqoh_is_active_idx" ON "halaqoh"("is_active");

-- CreateIndex
CREATE INDEX "takhosus_enrollments_halaqoh_id_idx" ON "takhosus_enrollments"("halaqoh_id");

-- CreateIndex
CREATE INDEX "takhosus_enrollments_status_idx" ON "takhosus_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "takhosus_enrollments_student_id_key" ON "takhosus_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "sanad_records_teacher_id_idx" ON "sanad_records"("teacher_id");

-- CreateIndex
CREATE INDEX "sanad_records_juz_idx" ON "sanad_records"("juz");

-- CreateIndex
CREATE UNIQUE INDEX "sanad_records_enrollment_id_juz_key" ON "sanad_records"("enrollment_id", "juz");

-- CreateIndex
CREATE INDEX "daily_muhasabah_date_idx" ON "daily_muhasabah"("date");

-- CreateIndex
CREATE INDEX "daily_muhasabah_mood_idx" ON "daily_muhasabah"("mood");

-- CreateIndex
CREATE UNIQUE INDEX "daily_muhasabah_student_id_date_key" ON "daily_muhasabah"("student_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "donation_campaigns_slug_key" ON "donation_campaigns"("slug");

-- CreateIndex
CREATE INDEX "donation_campaigns_unit_id_idx" ON "donation_campaigns"("unit_id");

-- CreateIndex
CREATE INDEX "donation_campaigns_status_idx" ON "donation_campaigns"("status");

-- CreateIndex
CREATE INDEX "donation_campaigns_start_date_idx" ON "donation_campaigns"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "donations_receipt_number_key" ON "donations"("receipt_number");

-- CreateIndex
CREATE INDEX "donations_campaign_id_idx" ON "donations"("campaign_id");

-- CreateIndex
CREATE INDEX "donations_unit_id_idx" ON "donations"("unit_id");

-- CreateIndex
CREATE INDEX "donations_type_idx" ON "donations"("type");

-- CreateIndex
CREATE INDEX "donations_status_idx" ON "donations"("status");

-- CreateIndex
CREATE INDEX "donations_donated_at_idx" ON "donations"("donated_at");

-- CreateIndex
CREATE INDEX "admission_waves_status_idx" ON "admission_waves"("status");

-- CreateIndex
CREATE INDEX "admission_waves_start_date_idx" ON "admission_waves"("start_date");

-- CreateIndex
CREATE UNIQUE INDEX "admission_waves_period_id_wave_number_key" ON "admission_waves"("period_id", "wave_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_fkey" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_enrollments" ADD CONSTRAINT "class_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahfidz_records" ADD CONSTRAINT "tahfidz_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahfidz_records" ADD CONSTRAINT "tahfidz_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahfidz_targets" ADD CONSTRAINT "tahfidz_targets_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tahfidz_targets" ADD CONSTRAINT "tahfidz_targets_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dormitories" ADD CONSTRAINT "dormitories_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_assignments" ADD CONSTRAINT "room_assignments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits" ADD CONSTRAINT "permits_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits" ADD CONSTRAINT "permits_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_reported_by_id_fkey" FOREIGN KEY ("reported_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_given_by_id_fkey" FOREIGN KEY ("given_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_types" ADD CONSTRAINT "payment_types_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foundation_documents" ADD CONSTRAINT "foundation_documents_foundation_id_fkey" FOREIGN KEY ("foundation_id") REFERENCES "foundations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_periods" ADD CONSTRAINT "admission_periods_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_periods" ADD CONSTRAINT "admission_periods_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrants" ADD CONSTRAINT "registrants_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "admission_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrants" ADD CONSTRAINT "registrants_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "admission_waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrants" ADD CONSTRAINT "registrants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrant_documents" ADD CONSTRAINT "registrant_documents_registrant_id_fkey" FOREIGN KEY ("registrant_id") REFERENCES "registrants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_categories" ADD CONSTRAINT "book_categories_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "book_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowings" ADD CONSTRAINT "borrowings_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "borrowings" ADD CONSTRAINT "borrowings_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medications" ADD CONSTRAINT "medications_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_usage_logs" ADD CONSTRAINT "medication_usage_logs_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "medications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_usage_logs" ADD CONSTRAINT "medication_usage_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_usage_logs" ADD CONSTRAINT "medication_usage_logs_given_by_id_fkey" FOREIGN KEY ("given_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_graded_by_id_fkey" FOREIGN KEY ("graded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_card_details" ADD CONSTRAINT "report_card_details_report_card_id_fkey" FOREIGN KEY ("report_card_id") REFERENCES "report_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni" ADD CONSTRAINT "alumni_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_careers" ADD CONSTRAINT "alumni_careers_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_educations" ADD CONSTRAINT "alumni_educations_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_donations" ADD CONSTRAINT "alumni_donations_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_donations" ADD CONSTRAINT "alumni_donations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_events" ADD CONSTRAINT "alumni_events_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_event_attendees" ADD CONSTRAINT "alumni_event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "alumni_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_event_attendees" ADD CONSTRAINT "alumni_event_attendees_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqoh" ADD CONSTRAINT "halaqoh_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "halaqoh" ADD CONSTRAINT "halaqoh_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takhosus_enrollments" ADD CONSTRAINT "takhosus_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "takhosus_enrollments" ADD CONSTRAINT "takhosus_enrollments_halaqoh_id_fkey" FOREIGN KEY ("halaqoh_id") REFERENCES "halaqoh"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanad_records" ADD CONSTRAINT "sanad_records_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "takhosus_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanad_records" ADD CONSTRAINT "sanad_records_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_muhasabah" ADD CONSTRAINT "daily_muhasabah_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_campaigns" ADD CONSTRAINT "donation_campaigns_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "donation_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_waves" ADD CONSTRAINT "admission_waves_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "admission_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
