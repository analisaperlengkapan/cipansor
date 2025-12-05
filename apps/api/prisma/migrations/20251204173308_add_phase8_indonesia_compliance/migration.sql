-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('JALAN_KAKI', 'SEPEDA', 'SEPEDA_MOTOR', 'MOBIL_PRIBADI', 'ANGKUTAN_UMUM', 'ANTAR_JEMPUT', 'PERAHU', 'OJEK', 'LAINNYA');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A', 'B', 'AB', 'O', 'TIDAK_TAHU');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('TIDAK_SEKOLAH', 'SD', 'SMP', 'SMA', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3', 'LAINNYA');

-- CreateEnum
CREATE TYPE "OccupationType" AS ENUM ('PNS', 'PEGAWAI_SWASTA', 'WIRASWASTA', 'PETANI', 'NELAYAN', 'BURUH', 'PEDAGANG', 'PENSIUNAN', 'TIDAK_BEKERJA', 'IBU_RUMAH_TANGGA', 'GURU', 'DOKTER', 'PENGACARA', 'LAINNYA', 'SUDAH_MENINGGAL');

-- CreateEnum
CREATE TYPE "IncomeRange" AS ENUM ('KURANG_500K', 'RANGE_500K_1JT', 'RANGE_1JT_2JT', 'RANGE_2JT_5JT', 'RANGE_5JT_10JT', 'RANGE_10JT_20JT', 'LEBIH_20JT', 'TIDAK_BERPENGHASILAN');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('PNS', 'PPPK', 'GTY', 'GTT', 'HONOR', 'KONTRAK');

-- CreateEnum
CREATE TYPE "TeacherCertification" AS ENUM ('BELUM_SERTIFIKASI', 'SUDAH_SERTIFIKASI', 'DALAM_PROSES');

-- CreateEnum
CREATE TYPE "LearningPhaseCode" AS ENUM ('FASE_A', 'FASE_B', 'FASE_C', 'FASE_D', 'FASE_E', 'FASE_F');

-- CreateEnum
CREATE TYPE "P5DimensionCode" AS ENUM ('BERIMAN', 'BERKEBINEKAAN', 'BERGOTONG_ROYONG', 'MANDIRI', 'BERNALAR_KRITIS', 'KREATIF');

-- CreateEnum
CREATE TYPE "AssessmentCategory" AS ENUM ('DIAGNOSTIK', 'FORMATIF', 'SUMATIF');

-- CreateEnum
CREATE TYPE "LandOwnership" AS ENUM ('MILIK_SENDIRI', 'SEWA', 'PINJAM_PAKAI', 'WAKAF', 'HIBAH', 'LAINNYA');

-- CreateEnum
CREATE TYPE "BuildingCondition" AS ENUM ('BAIK', 'RUSAK_RINGAN', 'RUSAK_SEDANG', 'RUSAK_BERAT');

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "blood_type" "BloodType",
ADD COLUMN     "child_order" INTEGER,
ADD COLUMN     "distance_to_school" DECIMAL(5,2),
ADD COLUMN     "district_id" TEXT,
ADD COLUMN     "father_birth_date" TIMESTAMP(3),
ADD COLUMN     "father_birth_place" TEXT,
ADD COLUMN     "father_education" "EducationLevel",
ADD COLUMN     "father_income" "IncomeRange",
ADD COLUMN     "father_name" TEXT,
ADD COLUMN     "father_nik" TEXT,
ADD COLUMN     "father_occupation" "OccupationType",
ADD COLUMN     "father_phone" TEXT,
ADD COLUMN     "guardian_education" "EducationLevel",
ADD COLUMN     "guardian_income" "IncomeRange",
ADD COLUMN     "guardian_name" TEXT,
ADD COLUMN     "guardian_nik" TEXT,
ADD COLUMN     "guardian_occupation" "OccupationType",
ADD COLUMN     "guardian_phone" TEXT,
ADD COLUMN     "guardian_relation" TEXT,
ADD COLUMN     "head_circumference" DECIMAL(5,2),
ADD COLUMN     "height" DECIMAL(5,2),
ADD COLUMN     "is_kks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_pkh" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kip_number" TEXT,
ADD COLUMN     "living_with" TEXT,
ADD COLUMN     "mother_birth_date" TIMESTAMP(3),
ADD COLUMN     "mother_birth_place" TEXT,
ADD COLUMN     "mother_education" "EducationLevel",
ADD COLUMN     "mother_income" "IncomeRange",
ADD COLUMN     "mother_name" TEXT,
ADD COLUMN     "mother_nik" TEXT,
ADD COLUMN     "mother_occupation" "OccupationType",
ADD COLUMN     "mother_phone" TEXT,
ADD COLUMN     "nationality" TEXT NOT NULL DEFAULT 'Indonesia',
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "no_akta" TEXT,
ADD COLUMN     "no_kk" TEXT,
ADD COLUMN     "number_of_siblings" INTEGER,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "province_id" TEXT,
ADD COLUMN     "regency_id" TEXT,
ADD COLUMN     "religion" TEXT NOT NULL DEFAULT 'ISLAM',
ADD COLUMN     "rt" TEXT,
ADD COLUMN     "rw" TEXT,
ADD COLUMN     "special_needs" TEXT,
ADD COLUMN     "transport_mode" "TransportMode",
ADD COLUMN     "travel_time" INTEGER,
ADD COLUMN     "village_id" TEXT,
ADD COLUMN     "weight" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "teachers" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "birth_date" TIMESTAMP(3),
ADD COLUMN     "birth_place" TEXT,
ADD COLUMN     "certification_number" TEXT,
ADD COLUMN     "certification_status" "TeacherCertification",
ADD COLUMN     "certification_subject" TEXT,
ADD COLUMN     "certification_year" INTEGER,
ADD COLUMN     "district_id" TEXT,
ADD COLUMN     "employment_status" "EmploymentStatus",
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "golongan" TEXT,
ADD COLUMN     "last_education" "EducationLevel",
ADD COLUMN     "last_education_institution" TEXT,
ADD COLUMN     "last_education_major" TEXT,
ADD COLUMN     "last_education_year" INTEGER,
ADD COLUMN     "nationality" TEXT NOT NULL DEFAULT 'Indonesia',
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "no_kk" TEXT,
ADD COLUMN     "pangkat" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "province_id" TEXT,
ADD COLUMN     "regency_id" TEXT,
ADD COLUMN     "religion" TEXT NOT NULL DEFAULT 'ISLAM',
ADD COLUMN     "rt" TEXT,
ADD COLUMN     "rw" TEXT,
ADD COLUMN     "sk_date" TIMESTAMP(3),
ADD COLUMN     "sk_number" TEXT,
ADD COLUMN     "tmt_guru" TIMESTAMP(3),
ADD COLUMN     "tmt_pns" TIMESTAMP(3),
ADD COLUMN     "village_id" TEXT,
ADD COLUMN     "weekly_hours" INTEGER;

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regencies" (
    "id" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'KABUPATEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "regency_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villages" (
    "id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DESA',
    "postal_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "villages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_phases" (
    "id" TEXT NOT NULL,
    "code" "LearningPhaseCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "gradeRange" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_outcomes" (
    "id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "elements" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_objectives" (
    "id" TEXT NOT NULL,
    "learning_outcome_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "indicators" JSONB,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_modules" (
    "id" TEXT NOT NULL,
    "learning_objective_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "class_id" TEXT,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "objectives" TEXT NOT NULL,
    "prerequisites" TEXT,
    "targetLearners" TEXT,
    "materials" JSONB,
    "activities" JSONB,
    "assessment_plan" JSONB,
    "differentiation" JSONB,
    "reflection" TEXT,
    "attachments" JSONB,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p5_themes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p5_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p5_projects" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "class_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB,
    "dimensions" JSONB NOT NULL,
    "activities" JSONB,
    "schedule" JSONB,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "p5_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "p5_assessments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "beriman" TEXT,
    "berkebinekaan" TEXT,
    "bergotong_royong" TEXT,
    "mandiri" TEXT,
    "bernalar_kritis" TEXT,
    "kreatif" TEXT,
    "overall_grade" TEXT,
    "notes" TEXT,
    "assessed_by_id" TEXT NOT NULL,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "p5_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merdeka_assessments" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "learning_objective_id" TEXT,
    "teacher_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "AssessmentCategory" NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "assessment_date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "max_score" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "weight" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "rubric" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merdeka_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merdeka_assessment_results" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "percentage" DECIMAL(5,2),
    "grade" TEXT,
    "feedback" TEXT,
    "attachments" JSONB,
    "graded_by_id" TEXT NOT NULL,
    "graded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merdeka_assessment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_components" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quota" INTEGER,
    "requirements" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_discounts" (
    "id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discount_value" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarship_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarship_recipients" (
    "id" TEXT NOT NULL,
    "scholarship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scholarship_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "debit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reference" TEXT,
    "reference_type" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lands" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" DECIMAL(12,2) NOT NULL,
    "ownership" "LandOwnership" NOT NULL,
    "certificate_no" TEXT,
    "certificate_date" TIMESTAMP(3),
    "acquisition_date" TIMESTAMP(3),
    "acquisition_value" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "land_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floors" INTEGER NOT NULL DEFAULT 1,
    "building_area" DECIMAL(12,2) NOT NULL,
    "year_built" INTEGER,
    "condition" "BuildingCondition" NOT NULL DEFAULT 'BAIK',
    "last_renovation" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_rooms" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "building_id" TEXT,
    "room_type_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" INTEGER NOT NULL DEFAULT 1,
    "length" DECIMAL(8,2),
    "width" DECIMAL(8,2),
    "area" DECIMAL(10,2),
    "capacity" INTEGER,
    "condition" "BuildingCondition" NOT NULL DEFAULT 'BAIK',
    "facilities" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "facility_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_schedule_templates" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_schedule_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_activities" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musyrifs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "teacher_id" TEXT,
    "code" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "join_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "musyrifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "musyrif_assignments" (
    "id" TEXT NOT NULL,
    "musyrif_id" TEXT NOT NULL,
    "dormitory_id" TEXT NOT NULL,
    "room_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PEMBINA',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "musyrif_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "santri_wallets" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "last_top_up" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "santri_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_before" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "reference" TEXT,
    "reference_type" TEXT,
    "description" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provinces_code_key" ON "provinces"("code");

-- CreateIndex
CREATE INDEX "provinces_code_idx" ON "provinces"("code");

-- CreateIndex
CREATE UNIQUE INDEX "regencies_code_key" ON "regencies"("code");

-- CreateIndex
CREATE INDEX "regencies_province_id_idx" ON "regencies"("province_id");

-- CreateIndex
CREATE INDEX "regencies_code_idx" ON "regencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE INDEX "districts_regency_id_idx" ON "districts"("regency_id");

-- CreateIndex
CREATE INDEX "districts_code_idx" ON "districts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "villages_code_key" ON "villages"("code");

-- CreateIndex
CREATE INDEX "villages_district_id_idx" ON "villages"("district_id");

-- CreateIndex
CREATE INDEX "villages_code_idx" ON "villages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "learning_phases_code_key" ON "learning_phases"("code");

-- CreateIndex
CREATE INDEX "learning_outcomes_phase_id_idx" ON "learning_outcomes"("phase_id");

-- CreateIndex
CREATE INDEX "learning_outcomes_subject_id_idx" ON "learning_outcomes"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_outcomes_phase_id_subject_id_code_key" ON "learning_outcomes"("phase_id", "subject_id", "code");

-- CreateIndex
CREATE INDEX "learning_objectives_learning_outcome_id_idx" ON "learning_objectives"("learning_outcome_id");

-- CreateIndex
CREATE INDEX "teaching_modules_learning_objective_id_idx" ON "teaching_modules"("learning_objective_id");

-- CreateIndex
CREATE INDEX "teaching_modules_teacher_id_idx" ON "teaching_modules"("teacher_id");

-- CreateIndex
CREATE INDEX "teaching_modules_class_id_idx" ON "teaching_modules"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "p5_themes_code_key" ON "p5_themes"("code");

-- CreateIndex
CREATE INDEX "p5_projects_unit_id_idx" ON "p5_projects"("unit_id");

-- CreateIndex
CREATE INDEX "p5_projects_academic_year_id_idx" ON "p5_projects"("academic_year_id");

-- CreateIndex
CREATE INDEX "p5_projects_theme_id_idx" ON "p5_projects"("theme_id");

-- CreateIndex
CREATE INDEX "p5_assessments_project_id_idx" ON "p5_assessments"("project_id");

-- CreateIndex
CREATE INDEX "p5_assessments_student_id_idx" ON "p5_assessments"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "p5_assessments_project_id_student_id_key" ON "p5_assessments"("project_id", "student_id");

-- CreateIndex
CREATE INDEX "merdeka_assessments_unit_id_idx" ON "merdeka_assessments"("unit_id");

-- CreateIndex
CREATE INDEX "merdeka_assessments_class_id_idx" ON "merdeka_assessments"("class_id");

-- CreateIndex
CREATE INDEX "merdeka_assessments_subject_id_idx" ON "merdeka_assessments"("subject_id");

-- CreateIndex
CREATE INDEX "merdeka_assessments_category_idx" ON "merdeka_assessments"("category");

-- CreateIndex
CREATE INDEX "merdeka_assessment_results_assessment_id_idx" ON "merdeka_assessment_results"("assessment_id");

-- CreateIndex
CREATE INDEX "merdeka_assessment_results_student_id_idx" ON "merdeka_assessment_results"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "merdeka_assessment_results_assessment_id_student_id_key" ON "merdeka_assessment_results"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "payment_components_unit_id_idx" ON "payment_components"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_components_unit_id_code_key" ON "payment_components"("unit_id", "code");

-- CreateIndex
CREATE INDEX "scholarships_unit_id_idx" ON "scholarships"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_discounts_scholarship_id_component_id_key" ON "scholarship_discounts"("scholarship_id", "component_id");

-- CreateIndex
CREATE INDEX "scholarship_recipients_scholarship_id_idx" ON "scholarship_recipients"("scholarship_id");

-- CreateIndex
CREATE INDEX "scholarship_recipients_student_id_idx" ON "scholarship_recipients"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "scholarship_recipients_scholarship_id_student_id_academic_y_key" ON "scholarship_recipients"("scholarship_id", "student_id", "academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_codes_code_key" ON "account_codes"("code");

-- CreateIndex
CREATE INDEX "account_codes_type_idx" ON "account_codes"("type");

-- CreateIndex
CREATE INDEX "journal_entries_unit_id_idx" ON "journal_entries"("unit_id");

-- CreateIndex
CREATE INDEX "journal_entries_account_id_idx" ON "journal_entries"("account_id");

-- CreateIndex
CREATE INDEX "journal_entries_date_idx" ON "journal_entries"("date");

-- CreateIndex
CREATE INDEX "lands_unit_id_idx" ON "lands"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "lands_unit_id_code_key" ON "lands"("unit_id", "code");

-- CreateIndex
CREATE INDEX "buildings_unit_id_idx" ON "buildings"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "buildings_unit_id_code_key" ON "buildings"("unit_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_code_key" ON "room_types"("code");

-- CreateIndex
CREATE INDEX "facility_rooms_unit_id_idx" ON "facility_rooms"("unit_id");

-- CreateIndex
CREATE INDEX "facility_rooms_room_type_id_idx" ON "facility_rooms"("room_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "facility_rooms_unit_id_code_key" ON "facility_rooms"("unit_id", "code");

-- CreateIndex
CREATE INDEX "daily_schedule_templates_unit_id_idx" ON "daily_schedule_templates"("unit_id");

-- CreateIndex
CREATE INDEX "daily_activities_template_id_idx" ON "daily_activities"("template_id");

-- CreateIndex
CREATE INDEX "musyrifs_unit_id_idx" ON "musyrifs"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "musyrifs_unit_id_user_id_key" ON "musyrifs"("unit_id", "user_id");

-- CreateIndex
CREATE INDEX "musyrif_assignments_musyrif_id_idx" ON "musyrif_assignments"("musyrif_id");

-- CreateIndex
CREATE INDEX "musyrif_assignments_dormitory_id_idx" ON "musyrif_assignments"("dormitory_id");

-- CreateIndex
CREATE UNIQUE INDEX "santri_wallets_student_id_key" ON "santri_wallets"("student_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "students_province_id_idx" ON "students"("province_id");

-- CreateIndex
CREATE INDEX "students_regency_id_idx" ON "students"("regency_id");

-- CreateIndex
CREATE INDEX "teachers_province_id_idx" ON "teachers"("province_id");

-- CreateIndex
CREATE INDEX "teachers_regency_id_idx" ON "teachers"("regency_id");

-- CreateIndex
CREATE INDEX "teachers_employment_status_idx" ON "teachers"("employment_status");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_village_id_fkey" FOREIGN KEY ("village_id") REFERENCES "villages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regencies" ADD CONSTRAINT "regencies_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_regency_id_fkey" FOREIGN KEY ("regency_id") REFERENCES "regencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "learning_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_outcomes" ADD CONSTRAINT "learning_outcomes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_objectives" ADD CONSTRAINT "learning_objectives_learning_outcome_id_fkey" FOREIGN KEY ("learning_outcome_id") REFERENCES "learning_outcomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_modules" ADD CONSTRAINT "teaching_modules_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_modules" ADD CONSTRAINT "teaching_modules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_modules" ADD CONSTRAINT "teaching_modules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_projects" ADD CONSTRAINT "p5_projects_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_projects" ADD CONSTRAINT "p5_projects_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_projects" ADD CONSTRAINT "p5_projects_theme_id_fkey" FOREIGN KEY ("theme_id") REFERENCES "p5_themes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_projects" ADD CONSTRAINT "p5_projects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_projects" ADD CONSTRAINT "p5_projects_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_assessments" ADD CONSTRAINT "p5_assessments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "p5_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_assessments" ADD CONSTRAINT "p5_assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "p5_assessments" ADD CONSTRAINT "p5_assessments_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessments" ADD CONSTRAINT "merdeka_assessments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessments" ADD CONSTRAINT "merdeka_assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessments" ADD CONSTRAINT "merdeka_assessments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessments" ADD CONSTRAINT "merdeka_assessments_learning_objective_id_fkey" FOREIGN KEY ("learning_objective_id") REFERENCES "learning_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessments" ADD CONSTRAINT "merdeka_assessments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessments" ADD CONSTRAINT "merdeka_assessments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessment_results" ADD CONSTRAINT "merdeka_assessment_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "merdeka_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessment_results" ADD CONSTRAINT "merdeka_assessment_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merdeka_assessment_results" ADD CONSTRAINT "merdeka_assessment_results_graded_by_id_fkey" FOREIGN KEY ("graded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_components" ADD CONSTRAINT "payment_components_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_discounts" ADD CONSTRAINT "scholarship_discounts_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_discounts" ADD CONSTRAINT "scholarship_discounts_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "payment_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_recipients" ADD CONSTRAINT "scholarship_recipients_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_recipients" ADD CONSTRAINT "scholarship_recipients_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_recipients" ADD CONSTRAINT "scholarship_recipients_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scholarship_recipients" ADD CONSTRAINT "scholarship_recipients_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_codes" ADD CONSTRAINT "account_codes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "account_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account_codes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lands" ADD CONSTRAINT "lands_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_land_id_fkey" FOREIGN KEY ("land_id") REFERENCES "lands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_rooms" ADD CONSTRAINT "facility_rooms_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_rooms" ADD CONSTRAINT "facility_rooms_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_rooms" ADD CONSTRAINT "facility_rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_schedule_templates" ADD CONSTRAINT "daily_schedule_templates_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "daily_schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrifs" ADD CONSTRAINT "musyrifs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrifs" ADD CONSTRAINT "musyrifs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrifs" ADD CONSTRAINT "musyrifs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrifs" ADD CONSTRAINT "musyrifs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrif_assignments" ADD CONSTRAINT "musyrif_assignments_musyrif_id_fkey" FOREIGN KEY ("musyrif_id") REFERENCES "musyrifs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrif_assignments" ADD CONSTRAINT "musyrif_assignments_dormitory_id_fkey" FOREIGN KEY ("dormitory_id") REFERENCES "dormitories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "musyrif_assignments" ADD CONSTRAINT "musyrif_assignments_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "santri_wallets" ADD CONSTRAINT "santri_wallets_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "santri_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
