-- CreateEnum
CREATE TYPE "ExtracurricularCategory" AS ENUM ('SPORTS', 'ARTS', 'ACADEMIC', 'RELIGIOUS', 'SCOUTING', 'LEADERSHIP', 'LANGUAGE', 'TECHNOLOGY', 'OTHER');

-- CreateEnum
CREATE TYPE "ExtracurricularStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'GRADUATED', 'WITHDRAWN', 'DISMISSED');

-- CreateEnum
CREATE TYPE "CounselingCategory" AS ENUM ('ACADEMIC', 'CAREER', 'PERSONAL', 'SOCIAL', 'FAMILY', 'SPIRITUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CounselingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "CounselingPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('INTERNAL', 'EXTERNAL', 'PARENT', 'MEDICAL');

-- CreateEnum
CREATE TYPE "DutyCategory" AS ENUM ('CLEANING', 'SECURITY', 'WORSHIP', 'KITCHEN', 'LIBRARY', 'DORMITORY', 'GARDEN', 'OTHER');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('PENDING', 'COMPLETED', 'ABSENT', 'SUBSTITUTED');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "MealAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'SICK', 'PERMIT');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ACADEMIC', 'RELIGIOUS', 'EXTRACURRICULAR', 'MEETING', 'CEREMONY', 'HOLIDAY', 'OTHER');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('ALL_UNITS', 'SPECIFIC_UNIT', 'SPECIFIC_CLASS');

-- CreateEnum
CREATE TYPE "KitabLevel" AS ENUM ('PEMULA', 'DASAR', 'MENENGAH', 'LANJUT', 'MAHIR');

-- CreateEnum
CREATE TYPE "KitabCategory" AS ENUM ('TAUHID', 'FIQH', 'AKHLAQ', 'NAHWU', 'SHOROF', 'TAFSIR', 'HADITS', 'TARIKH', 'BALAGHAH', 'MANTIQ', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'FAMILY_CARD', 'ID_CARD', 'STUDENT_CARD', 'REPORT_CARD', 'DIPLOMA', 'CERTIFICATE', 'MEDICAL_RECORD', 'PHOTO', 'RECOMMENDATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('ACADEMIC', 'BEHAVIOR', 'ATTENDANCE', 'ACHIEVEMENT', 'CONCERN', 'HEALTH', 'SOCIAL', 'SPIRITUAL', 'PARENT_COMMUNICATION', 'GENERAL');

-- CreateEnum
CREATE TYPE "NotePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('HOMEROOM_ONLY', 'TEACHERS', 'STAFF', 'PARENTS');

-- CreateEnum
CREATE TYPE "BehaviorType" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "BehaviorCategory" AS ENUM ('DISCIPLINE', 'RESPECT', 'RESPONSIBILITY', 'COOPERATION', 'CLEANLINESS', 'PUNCTUALITY', 'RELIGIOUS', 'OTHER');

-- CreateEnum
CREATE TYPE "KitabAssessmentType" AS ENUM ('SOROGAN', 'BANDONGAN', 'MUSYAWARAH', 'WRITTEN', 'ORAL', 'HAFALAN');

-- CreateEnum
CREATE TYPE "KitabProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "extracurriculars" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" "ExtracurricularCategory" NOT NULL,
    "description" TEXT,
    "schedule_day" "DayOfWeek"[],
    "schedule_time" TEXT,
    "venue" TEXT,
    "max_participants" INTEGER,
    "min_participants" INTEGER,
    "coach_id" TEXT,
    "assistant_coach_id" TEXT,
    "status" "ExtracurricularStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_compulsory" BOOLEAN NOT NULL DEFAULT false,
    "academic_year_id" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "extracurriculars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracurricular_enrollments" (
    "id" TEXT NOT NULL,
    "extracurricular_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "grade" TEXT,
    "notes" TEXT,
    "graduated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracurricular_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracurricular_attendances" (
    "id" TEXT NOT NULL,
    "extracurricular_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracurricular_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracurricular_achievements" (
    "id" TEXT NOT NULL,
    "extracurricular_id" TEXT NOT NULL,
    "student_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "rank" TEXT,
    "organizer" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "certificate_url" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracurricular_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_sessions" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "counselor_id" TEXT NOT NULL,
    "category" "CounselingCategory" NOT NULL,
    "priority" "CounselingPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "location" TEXT,
    "status" "CounselingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "summary" TEXT,
    "recommendations" TEXT,
    "follow_up_date" TIMESTAMP(3),
    "is_confidential" BOOLEAN NOT NULL DEFAULT true,
    "parent_notified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_notes" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "note_type" TEXT NOT NULL DEFAULT 'general',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counseling_referrals" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "ReferralType" NOT NULL,
    "referred_to" TEXT NOT NULL,
    "institution" TEXT,
    "reason" TEXT NOT NULL,
    "contact_info" TEXT,
    "referred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follow_up_date" TIMESTAMP(3),
    "outcome" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counseling_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_types" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" "DutyCategory" NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duty_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "duty_rosters" (
    "id" TEXT NOT NULL,
    "duty_type_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "status" "DutyStatus" NOT NULL DEFAULT 'PENDING',
    "substitute_id" TEXT,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "duty_rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_menus" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "meal_type" "MealType" NOT NULL,
    "main_dish" TEXT NOT NULL,
    "side_dish" TEXT,
    "vegetable" TEXT,
    "soup" TEXT,
    "dessert" TEXT,
    "drink" TEXT,
    "notes" TEXT,
    "calories" INTEGER,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_attendances" (
    "id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "MealAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "portions" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_diets" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "diet_type" TEXT NOT NULL,
    "allergies" TEXT[],
    "medical_notes" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_diets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "class_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" "EventType" NOT NULL,
    "scope" "EventScope" NOT NULL DEFAULT 'ALL_UNITS',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TEXT,
    "end_time" TEXT,
    "location" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "online_url" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitab_kuning" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" "KitabCategory" NOT NULL,
    "level" "KitabLevel" NOT NULL,
    "total_pages" INTEGER,
    "total_bab" INTEGER,
    "description" TEXT,
    "cover_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitab_kuning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitab_progress" (
    "id" TEXT NOT NULL,
    "kitab_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "current_page" INTEGER NOT NULL DEFAULT 0,
    "current_bab" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "grade" TEXT,
    "notes" TEXT,
    "academic_year_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitab_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muhadhoroh" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'Indonesian',
    "duration" INTEGER,
    "content_score" INTEGER,
    "delivery_score" INTEGER,
    "language_score" INTEGER,
    "total_score" INTEGER,
    "grade" TEXT,
    "feedback" TEXT,
    "evaluator_id" TEXT,
    "evaluated_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "video_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "muhadhoroh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muhadatsah" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "language" TEXT NOT NULL,
    "partner_id" TEXT,
    "topic" TEXT,
    "duration" INTEGER,
    "fluency_score" INTEGER,
    "grammar_score" INTEGER,
    "vocabulary_score" INTEGER,
    "pronunciation_score" INTEGER,
    "total_score" INTEGER,
    "grade" TEXT,
    "feedback" TEXT,
    "evaluator_id" TEXT,
    "evaluated_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "recording_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "muhadatsah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "document_number" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_certificates" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "certificate_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "certificate_number" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "verification_url" TEXT NOT NULL,
    "grade" TEXT,
    "rank" INTEGER,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "signatory_name" TEXT NOT NULL,
    "signatory_title" TEXT NOT NULL,
    "signature_url" TEXT,
    "pdf_url" TEXT,
    "thumbnail_url" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_notes" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "category" "NoteCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "NotePriority" NOT NULL DEFAULT 'MEDIUM',
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'HOMEROOM_ONLY',
    "requires_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMP(3),
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavior_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "behavior_type" "BehaviorType" NOT NULL,
    "category" "BehaviorCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER,
    "action_taken" TEXT,
    "witnessed_by_id" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavior_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitab" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "author" TEXT,
    "category" "KitabCategory" NOT NULL,
    "level" "KitabLevel" NOT NULL,
    "description" TEXT,
    "total_bab" INTEGER,
    "total_halaman" INTEGER,
    "total_fashl" INTEGER,
    "target_duration" TEXT,
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitab_assignments" (
    "id" TEXT NOT NULL,
    "kitab_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "schedule" JSONB,
    "target_bab" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitab_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitab_student_progress" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "kitab_assignment_id" TEXT NOT NULL,
    "current_bab" INTEGER NOT NULL DEFAULT 0,
    "current_halaman" INTEGER,
    "current_fashl" INTEGER,
    "status" "KitabProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitab_student_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitab_progress_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "kitab_assignment_id" TEXT NOT NULL,
    "kitab_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "assessment_type" "KitabAssessmentType" NOT NULL,
    "bab_number" INTEGER,
    "halaman_start" INTEGER,
    "halaman_end" INTEGER,
    "fashl_number" INTEGER,
    "topic" TEXT,
    "score" DOUBLE PRECISION,
    "predicate" TEXT,
    "is_passed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "teacher_feedback" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitab_progress_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extracurriculars_unit_id_idx" ON "extracurriculars"("unit_id");

-- CreateIndex
CREATE INDEX "extracurriculars_category_idx" ON "extracurriculars"("category");

-- CreateIndex
CREATE INDEX "extracurriculars_status_idx" ON "extracurriculars"("status");

-- CreateIndex
CREATE UNIQUE INDEX "extracurriculars_unit_id_code_key" ON "extracurriculars"("unit_id", "code");

-- CreateIndex
CREATE INDEX "extracurricular_enrollments_extracurricular_id_idx" ON "extracurricular_enrollments"("extracurricular_id");

-- CreateIndex
CREATE INDEX "extracurricular_enrollments_student_id_idx" ON "extracurricular_enrollments"("student_id");

-- CreateIndex
CREATE INDEX "extracurricular_enrollments_status_idx" ON "extracurricular_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "extracurricular_enrollments_extracurricular_id_student_id_key" ON "extracurricular_enrollments"("extracurricular_id", "student_id");

-- CreateIndex
CREATE INDEX "extracurricular_attendances_extracurricular_id_idx" ON "extracurricular_attendances"("extracurricular_id");

-- CreateIndex
CREATE INDEX "extracurricular_attendances_student_id_idx" ON "extracurricular_attendances"("student_id");

-- CreateIndex
CREATE INDEX "extracurricular_attendances_date_idx" ON "extracurricular_attendances"("date");

-- CreateIndex
CREATE UNIQUE INDEX "extracurricular_attendances_extracurricular_id_student_id_d_key" ON "extracurricular_attendances"("extracurricular_id", "student_id", "date");

-- CreateIndex
CREATE INDEX "extracurricular_achievements_extracurricular_id_idx" ON "extracurricular_achievements"("extracurricular_id");

-- CreateIndex
CREATE INDEX "extracurricular_achievements_student_id_idx" ON "extracurricular_achievements"("student_id");

-- CreateIndex
CREATE INDEX "extracurricular_achievements_event_date_idx" ON "extracurricular_achievements"("event_date");

-- CreateIndex
CREATE INDEX "counseling_sessions_unit_id_idx" ON "counseling_sessions"("unit_id");

-- CreateIndex
CREATE INDEX "counseling_sessions_student_id_idx" ON "counseling_sessions"("student_id");

-- CreateIndex
CREATE INDEX "counseling_sessions_counselor_id_idx" ON "counseling_sessions"("counselor_id");

-- CreateIndex
CREATE INDEX "counseling_sessions_category_idx" ON "counseling_sessions"("category");

-- CreateIndex
CREATE INDEX "counseling_sessions_status_idx" ON "counseling_sessions"("status");

-- CreateIndex
CREATE INDEX "counseling_sessions_scheduled_at_idx" ON "counseling_sessions"("scheduled_at");

-- CreateIndex
CREATE INDEX "counseling_notes_session_id_idx" ON "counseling_notes"("session_id");

-- CreateIndex
CREATE INDEX "counseling_referrals_session_id_idx" ON "counseling_referrals"("session_id");

-- CreateIndex
CREATE INDEX "counseling_referrals_type_idx" ON "counseling_referrals"("type");

-- CreateIndex
CREATE INDEX "duty_types_unit_id_idx" ON "duty_types"("unit_id");

-- CreateIndex
CREATE INDEX "duty_types_category_idx" ON "duty_types"("category");

-- CreateIndex
CREATE UNIQUE INDEX "duty_types_unit_id_code_key" ON "duty_types"("unit_id", "code");

-- CreateIndex
CREATE INDEX "duty_rosters_duty_type_id_idx" ON "duty_rosters"("duty_type_id");

-- CreateIndex
CREATE INDEX "duty_rosters_student_id_idx" ON "duty_rosters"("student_id");

-- CreateIndex
CREATE INDEX "duty_rosters_date_idx" ON "duty_rosters"("date");

-- CreateIndex
CREATE INDEX "duty_rosters_status_idx" ON "duty_rosters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "duty_rosters_duty_type_id_student_id_date_key" ON "duty_rosters"("duty_type_id", "student_id", "date");

-- CreateIndex
CREATE INDEX "meal_menus_unit_id_idx" ON "meal_menus"("unit_id");

-- CreateIndex
CREATE INDEX "meal_menus_date_idx" ON "meal_menus"("date");

-- CreateIndex
CREATE INDEX "meal_menus_meal_type_idx" ON "meal_menus"("meal_type");

-- CreateIndex
CREATE UNIQUE INDEX "meal_menus_unit_id_date_meal_type_key" ON "meal_menus"("unit_id", "date", "meal_type");

-- CreateIndex
CREATE INDEX "meal_attendances_menu_id_idx" ON "meal_attendances"("menu_id");

-- CreateIndex
CREATE INDEX "meal_attendances_student_id_idx" ON "meal_attendances"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "meal_attendances_menu_id_student_id_key" ON "meal_attendances"("menu_id", "student_id");

-- CreateIndex
CREATE INDEX "special_diets_student_id_idx" ON "special_diets"("student_id");

-- CreateIndex
CREATE INDEX "special_diets_is_active_idx" ON "special_diets"("is_active");

-- CreateIndex
CREATE INDEX "calendar_events_unit_id_idx" ON "calendar_events"("unit_id");

-- CreateIndex
CREATE INDEX "calendar_events_class_id_idx" ON "calendar_events"("class_id");

-- CreateIndex
CREATE INDEX "calendar_events_event_type_idx" ON "calendar_events"("event_type");

-- CreateIndex
CREATE INDEX "calendar_events_start_date_idx" ON "calendar_events"("start_date");

-- CreateIndex
CREATE INDEX "kitab_kuning_category_idx" ON "kitab_kuning"("category");

-- CreateIndex
CREATE INDEX "kitab_kuning_level_idx" ON "kitab_kuning"("level");

-- CreateIndex
CREATE INDEX "kitab_progress_kitab_id_idx" ON "kitab_progress"("kitab_id");

-- CreateIndex
CREATE INDEX "kitab_progress_student_id_idx" ON "kitab_progress"("student_id");

-- CreateIndex
CREATE INDEX "kitab_progress_teacher_id_idx" ON "kitab_progress"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "kitab_progress_kitab_id_student_id_academic_year_id_key" ON "kitab_progress"("kitab_id", "student_id", "academic_year_id");

-- CreateIndex
CREATE INDEX "muhadhoroh_unit_id_idx" ON "muhadhoroh"("unit_id");

-- CreateIndex
CREATE INDEX "muhadhoroh_student_id_idx" ON "muhadhoroh"("student_id");

-- CreateIndex
CREATE INDEX "muhadhoroh_scheduled_at_idx" ON "muhadhoroh"("scheduled_at");

-- CreateIndex
CREATE INDEX "muhadatsah_unit_id_idx" ON "muhadatsah"("unit_id");

-- CreateIndex
CREATE INDEX "muhadatsah_student_id_idx" ON "muhadatsah"("student_id");

-- CreateIndex
CREATE INDEX "muhadatsah_scheduled_at_idx" ON "muhadatsah"("scheduled_at");

-- CreateIndex
CREATE INDEX "muhadatsah_language_idx" ON "muhadatsah"("language");

-- CreateIndex
CREATE INDEX "student_documents_student_id_idx" ON "student_documents"("student_id");

-- CreateIndex
CREATE INDEX "student_documents_document_type_idx" ON "student_documents"("document_type");

-- CreateIndex
CREATE INDEX "student_documents_status_idx" ON "student_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "digital_certificates_certificate_number_key" ON "digital_certificates"("certificate_number");

-- CreateIndex
CREATE UNIQUE INDEX "digital_certificates_qr_code_key" ON "digital_certificates"("qr_code");

-- CreateIndex
CREATE INDEX "digital_certificates_student_id_idx" ON "digital_certificates"("student_id");

-- CreateIndex
CREATE INDEX "digital_certificates_certificate_type_idx" ON "digital_certificates"("certificate_type");

-- CreateIndex
CREATE INDEX "digital_certificates_issue_date_idx" ON "digital_certificates"("issue_date");

-- CreateIndex
CREATE INDEX "student_notes_student_id_idx" ON "student_notes"("student_id");

-- CreateIndex
CREATE INDEX "student_notes_class_id_idx" ON "student_notes"("class_id");

-- CreateIndex
CREATE INDEX "student_notes_category_idx" ON "student_notes"("category");

-- CreateIndex
CREATE INDEX "student_notes_priority_idx" ON "student_notes"("priority");

-- CreateIndex
CREATE INDEX "student_notes_created_by_id_idx" ON "student_notes"("created_by_id");

-- CreateIndex
CREATE INDEX "behavior_records_student_id_idx" ON "behavior_records"("student_id");

-- CreateIndex
CREATE INDEX "behavior_records_class_id_idx" ON "behavior_records"("class_id");

-- CreateIndex
CREATE INDEX "behavior_records_date_idx" ON "behavior_records"("date");

-- CreateIndex
CREATE INDEX "behavior_records_behavior_type_idx" ON "behavior_records"("behavior_type");

-- CreateIndex
CREATE INDEX "kitab_unit_id_idx" ON "kitab"("unit_id");

-- CreateIndex
CREATE INDEX "kitab_category_idx" ON "kitab"("category");

-- CreateIndex
CREATE INDEX "kitab_level_idx" ON "kitab"("level");

-- CreateIndex
CREATE INDEX "kitab_assignments_kitab_id_idx" ON "kitab_assignments"("kitab_id");

-- CreateIndex
CREATE INDEX "kitab_assignments_class_id_idx" ON "kitab_assignments"("class_id");

-- CreateIndex
CREATE INDEX "kitab_assignments_teacher_id_idx" ON "kitab_assignments"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "kitab_assignments_kitab_id_class_id_academic_year_id_semest_key" ON "kitab_assignments"("kitab_id", "class_id", "academic_year_id", "semester");

-- CreateIndex
CREATE INDEX "kitab_student_progress_student_id_idx" ON "kitab_student_progress"("student_id");

-- CreateIndex
CREATE INDEX "kitab_student_progress_kitab_assignment_id_idx" ON "kitab_student_progress"("kitab_assignment_id");

-- CreateIndex
CREATE INDEX "kitab_student_progress_status_idx" ON "kitab_student_progress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "kitab_student_progress_student_id_kitab_assignment_id_key" ON "kitab_student_progress"("student_id", "kitab_assignment_id");

-- CreateIndex
CREATE INDEX "kitab_progress_records_student_id_idx" ON "kitab_progress_records"("student_id");

-- CreateIndex
CREATE INDEX "kitab_progress_records_kitab_assignment_id_idx" ON "kitab_progress_records"("kitab_assignment_id");

-- CreateIndex
CREATE INDEX "kitab_progress_records_date_idx" ON "kitab_progress_records"("date");

-- CreateIndex
CREATE INDEX "kitab_progress_records_assessment_type_idx" ON "kitab_progress_records"("assessment_type");

-- AddForeignKey
ALTER TABLE "extracurriculars" ADD CONSTRAINT "extracurriculars_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurriculars" ADD CONSTRAINT "extracurriculars_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurriculars" ADD CONSTRAINT "extracurriculars_assistant_coach_id_fkey" FOREIGN KEY ("assistant_coach_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurriculars" ADD CONSTRAINT "extracurriculars_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_enrollments" ADD CONSTRAINT "extracurricular_enrollments_extracurricular_id_fkey" FOREIGN KEY ("extracurricular_id") REFERENCES "extracurriculars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_enrollments" ADD CONSTRAINT "extracurricular_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_attendances" ADD CONSTRAINT "extracurricular_attendances_extracurricular_id_fkey" FOREIGN KEY ("extracurricular_id") REFERENCES "extracurriculars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_attendances" ADD CONSTRAINT "extracurricular_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_attendances" ADD CONSTRAINT "extracurricular_attendances_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_achievements" ADD CONSTRAINT "extracurricular_achievements_extracurricular_id_fkey" FOREIGN KEY ("extracurricular_id") REFERENCES "extracurriculars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracurricular_achievements" ADD CONSTRAINT "extracurricular_achievements_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_sessions" ADD CONSTRAINT "counseling_sessions_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_notes" ADD CONSTRAINT "counseling_notes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "counseling_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_notes" ADD CONSTRAINT "counseling_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_referrals" ADD CONSTRAINT "counseling_referrals_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "counseling_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counseling_referrals" ADD CONSTRAINT "counseling_referrals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_types" ADD CONSTRAINT "duty_types_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_rosters" ADD CONSTRAINT "duty_rosters_duty_type_id_fkey" FOREIGN KEY ("duty_type_id") REFERENCES "duty_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_rosters" ADD CONSTRAINT "duty_rosters_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_rosters" ADD CONSTRAINT "duty_rosters_substitute_id_fkey" FOREIGN KEY ("substitute_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "duty_rosters" ADD CONSTRAINT "duty_rosters_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_menus" ADD CONSTRAINT "meal_menus_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_menus" ADD CONSTRAINT "meal_menus_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_attendances" ADD CONSTRAINT "meal_attendances_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "meal_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_attendances" ADD CONSTRAINT "meal_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_attendances" ADD CONSTRAINT "meal_attendances_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_diets" ADD CONSTRAINT "special_diets_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_diets" ADD CONSTRAINT "special_diets_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress" ADD CONSTRAINT "kitab_progress_kitab_id_fkey" FOREIGN KEY ("kitab_id") REFERENCES "kitab_kuning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress" ADD CONSTRAINT "kitab_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress" ADD CONSTRAINT "kitab_progress_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress" ADD CONSTRAINT "kitab_progress_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadhoroh" ADD CONSTRAINT "muhadhoroh_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadhoroh" ADD CONSTRAINT "muhadhoroh_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadhoroh" ADD CONSTRAINT "muhadhoroh_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadatsah" ADD CONSTRAINT "muhadatsah_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadatsah" ADD CONSTRAINT "muhadatsah_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadatsah" ADD CONSTRAINT "muhadatsah_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muhadatsah" ADD CONSTRAINT "muhadatsah_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_witnessed_by_id_fkey" FOREIGN KEY ("witnessed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavior_records" ADD CONSTRAINT "behavior_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab" ADD CONSTRAINT "kitab_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_assignments" ADD CONSTRAINT "kitab_assignments_kitab_id_fkey" FOREIGN KEY ("kitab_id") REFERENCES "kitab"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_assignments" ADD CONSTRAINT "kitab_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_assignments" ADD CONSTRAINT "kitab_assignments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_assignments" ADD CONSTRAINT "kitab_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_student_progress" ADD CONSTRAINT "kitab_student_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_student_progress" ADD CONSTRAINT "kitab_student_progress_kitab_assignment_id_fkey" FOREIGN KEY ("kitab_assignment_id") REFERENCES "kitab_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress_records" ADD CONSTRAINT "kitab_progress_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress_records" ADD CONSTRAINT "kitab_progress_records_kitab_assignment_id_fkey" FOREIGN KEY ("kitab_assignment_id") REFERENCES "kitab_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress_records" ADD CONSTRAINT "kitab_progress_records_kitab_id_fkey" FOREIGN KEY ("kitab_id") REFERENCES "kitab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitab_progress_records" ADD CONSTRAINT "kitab_progress_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
