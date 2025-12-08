-- CreateEnum
CREATE TYPE "PAUDAspect" AS ENUM ('NAM', 'FM', 'KOG', 'BHS', 'SE', 'SNI');

-- CreateEnum
CREATE TYPE "PAUDAchievementLevel" AS ENUM ('BB', 'MB', 'BSH', 'BSB');

-- CreateEnum
CREATE TYPE "PAUDReportPeriod" AS ENUM ('HARIAN', 'MINGGUAN', 'BULANAN', 'SEMESTER');

-- CreateEnum
CREATE TYPE "DailyMood" AS ENUM ('HAPPY', 'NEUTRAL', 'SAD', 'TIRED', 'EXCITED', 'SICK');

-- CreateEnum
CREATE TYPE "MealConsumption" AS ENUM ('HABIS', 'SETENGAH', 'SEDIKIT', 'TIDAK_MAU');

-- CreateEnum
CREATE TYPE "MurojaahType" AS ENUM ('YAUMIYAH', 'USBUIYAH', 'SYAHRIYAH', 'TASMI');

-- CreateEnum
CREATE TYPE "TahfidzMistakeType" AS ENUM ('LAHIN_JALI', 'LAHIN_KHAFI', 'TAJWID', 'LUPA', 'URUTAN');

-- CreateEnum
CREATE TYPE "SimaanType" AS ENUM ('BIN_NAZHR', 'BIL_GHAIB', 'TAHDIR', 'TASMI', 'KHATAM');

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapor_pesantren" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "tahfidz_data" JSONB,
    "ibadah_data" JSONB,
    "muhadhoroh_data" JSONB,
    "muhadatsah_data" JSONB,
    "kitab_progress_data" JSONB,
    "akhlak_data" JSONB,
    "attendance_data" JSONB,
    "overall_score" DOUBLE PRECISION,
    "overall_grade" TEXT,
    "notes" TEXT,
    "head_teacher_notes" TEXT,
    "musyrif_notes" TEXT,
    "principal_notes" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapor_pesantren_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paud_development_indicators" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "aspect" "PAUDAspect" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "age_group_min" INTEGER NOT NULL,
    "age_group_max" INTEGER NOT NULL,
    "order_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paud_development_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paud_development_assessments" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" TEXT,
    "period_type" "PAUDReportPeriod" NOT NULL,
    "period_date" DATE NOT NULL,
    "aspect" "PAUDAspect" NOT NULL,
    "indicator_id" TEXT,
    "achievement_level" "PAUDAchievementLevel" NOT NULL,
    "narrative_text" TEXT,
    "teacher_notes" TEXT,
    "recommendations" TEXT,
    "assessed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paud_development_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paud_assessment_evidences" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_name" TEXT,
    "caption" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paud_assessment_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paud_narrative_reports" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "narrative_nam" TEXT,
    "narrative_fm" TEXT,
    "narrative_kog" TEXT,
    "narrative_bhs" TEXT,
    "narrative_se" TEXT,
    "narrative_sni" TEXT,
    "overall_strengths" TEXT,
    "areas_for_development" TEXT,
    "parent_recommendations" TEXT,
    "teacher_signature" TEXT,
    "principal_signature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "finalized_at" TIMESTAMP(3),
    "printed_at" TIMESTAMP(3),
    "total_days" INTEGER NOT NULL DEFAULT 0,
    "present_days" INTEGER NOT NULL DEFAULT 0,
    "sick_days" INTEGER NOT NULL DEFAULT 0,
    "excused_days" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paud_narrative_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paud_report_photos" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "order_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paud_report_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_student_reports" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT,
    "report_date" DATE NOT NULL,
    "unit_type" "UnitType" NOT NULL,
    "arrival_time" TIMESTAMP(3),
    "mood" "DailyMood",
    "health_status" TEXT,
    "temperature" DOUBLE PRECISION,
    "had_breakfast" BOOLEAN,
    "meal_status" "MealConsumption",
    "snack_status" "MealConsumption",
    "nap_duration" INTEGER,
    "toilet_notes" TEXT,
    "sholat_dhuha" BOOLEAN,
    "tahfidz_activity" TEXT,
    "activities_summary" TEXT,
    "achievements" TEXT,
    "behavior_notes" TEXT,
    "teacher_notes" TEXT,
    "home_activity" TEXT,
    "departure_time" TIMESTAMP(3),
    "picked_up_by" TEXT,
    "notified_at" TIMESTAMP(3),
    "notified_via" TEXT,
    "parent_read_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_student_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_report_photos" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_homework" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "subject_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "murojaah_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "halaqoh_id" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "murojaah_type" "MurojaahType" NOT NULL,
    "murojaah_date" DATE NOT NULL,
    "juz_start" INTEGER NOT NULL,
    "juz_end" INTEGER NOT NULL,
    "pages_reviewed" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "mistake_count" INTEGER NOT NULL DEFAULT 0,
    "fluency_level" INTEGER NOT NULL DEFAULT 0,
    "tajwid_score" INTEGER,
    "notes" TEXT,
    "improvement_areas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "murojaah_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "murojaah_mistakes" (
    "id" TEXT NOT NULL,
    "murojaah_id" TEXT NOT NULL,
    "mistake_type" "TahfidzMistakeType" NOT NULL,
    "juz" INTEGER NOT NULL,
    "surah_number" INTEGER NOT NULL,
    "ayah_number" INTEGER,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "murojaah_mistakes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simaan_exams" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT,
    "halaqoh_id" TEXT,
    "simaan_type" "SimaanType" NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "session_number" INTEGER NOT NULL DEFAULT 1,
    "total_sessions" INTEGER NOT NULL DEFAULT 1,
    "juz_start" INTEGER NOT NULL,
    "juz_end" INTEGER NOT NULL,
    "overall_score" DOUBLE PRECISION,
    "tajwid_score" DOUBLE PRECISION,
    "fashoha_score" DOUBLE PRECISION,
    "tartil_score" DOUBLE PRECISION,
    "grade" TEXT,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recommendations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simaan_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simaan_examiners" (
    "id" TEXT NOT NULL,
    "simaan_id" TEXT NOT NULL,
    "examiner_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simaan_examiners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_metric_snapshots" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "academic_year_id" TEXT,
    "metric_type" TEXT NOT NULL,
    "metric_value" DOUBLE PRECISION NOT NULL,
    "metric_data" JSONB,
    "period_type" TEXT NOT NULL,
    "period_date" DATE NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "dashboard_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_comparison_reports" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "academic_year_id" TEXT,
    "report_type" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "report_data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generated_by_id" TEXT,

    CONSTRAINT "unit_comparison_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "record_date" DATE NOT NULL,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "head_circumference" DOUBLE PRECISION,
    "age_months" INTEGER NOT NULL,
    "weight_z_score" DOUBLE PRECISION,
    "height_z_score" DOUBLE PRECISION,
    "bmi_z_score" DOUBLE PRECISION,
    "nutrition_status" TEXT,
    "notes" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "immunization_records" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "vaccine_name" TEXT NOT NULL,
    "vaccine_code" TEXT,
    "dose_number" INTEGER NOT NULL,
    "scheduled_date" DATE,
    "administered_date" DATE,
    "administered_at" TEXT,
    "batch_number" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "recorded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "immunization_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_unit_id_key_key" ON "settings"("unit_id", "key");

-- CreateIndex
CREATE INDEX "rapor_pesantren_student_id_idx" ON "rapor_pesantren"("student_id");

-- CreateIndex
CREATE INDEX "rapor_pesantren_unit_id_idx" ON "rapor_pesantren"("unit_id");

-- CreateIndex
CREATE INDEX "rapor_pesantren_academic_year_id_idx" ON "rapor_pesantren"("academic_year_id");

-- CreateIndex
CREATE INDEX "rapor_pesantren_status_idx" ON "rapor_pesantren"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rapor_pesantren_student_id_academic_year_id_semester_key" ON "rapor_pesantren"("student_id", "academic_year_id", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "paud_development_indicators_code_key" ON "paud_development_indicators"("code");

-- CreateIndex
CREATE INDEX "paud_development_indicators_aspect_idx" ON "paud_development_indicators"("aspect");

-- CreateIndex
CREATE INDEX "paud_development_indicators_unit_id_idx" ON "paud_development_indicators"("unit_id");

-- CreateIndex
CREATE INDEX "paud_development_indicators_age_group_min_age_group_max_idx" ON "paud_development_indicators"("age_group_min", "age_group_max");

-- CreateIndex
CREATE INDEX "paud_development_assessments_student_id_idx" ON "paud_development_assessments"("student_id");

-- CreateIndex
CREATE INDEX "paud_development_assessments_unit_id_idx" ON "paud_development_assessments"("unit_id");

-- CreateIndex
CREATE INDEX "paud_development_assessments_academic_year_id_idx" ON "paud_development_assessments"("academic_year_id");

-- CreateIndex
CREATE INDEX "paud_development_assessments_aspect_idx" ON "paud_development_assessments"("aspect");

-- CreateIndex
CREATE INDEX "paud_development_assessments_period_date_idx" ON "paud_development_assessments"("period_date");

-- CreateIndex
CREATE INDEX "paud_assessment_evidences_assessment_id_idx" ON "paud_assessment_evidences"("assessment_id");

-- CreateIndex
CREATE INDEX "paud_narrative_reports_student_id_idx" ON "paud_narrative_reports"("student_id");

-- CreateIndex
CREATE INDEX "paud_narrative_reports_unit_id_idx" ON "paud_narrative_reports"("unit_id");

-- CreateIndex
CREATE INDEX "paud_narrative_reports_academic_year_id_idx" ON "paud_narrative_reports"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "paud_narrative_reports_student_id_academic_year_id_semester_key" ON "paud_narrative_reports"("student_id", "academic_year_id", "semester");

-- CreateIndex
CREATE INDEX "paud_report_photos_report_id_idx" ON "paud_report_photos"("report_id");

-- CreateIndex
CREATE INDEX "daily_student_reports_student_id_idx" ON "daily_student_reports"("student_id");

-- CreateIndex
CREATE INDEX "daily_student_reports_unit_id_idx" ON "daily_student_reports"("unit_id");

-- CreateIndex
CREATE INDEX "daily_student_reports_report_date_idx" ON "daily_student_reports"("report_date");

-- CreateIndex
CREATE INDEX "daily_student_reports_unit_type_idx" ON "daily_student_reports"("unit_type");

-- CreateIndex
CREATE UNIQUE INDEX "daily_student_reports_student_id_report_date_key" ON "daily_student_reports"("student_id", "report_date");

-- CreateIndex
CREATE INDEX "daily_report_photos_report_id_idx" ON "daily_report_photos"("report_id");

-- CreateIndex
CREATE INDEX "daily_homework_report_id_idx" ON "daily_homework"("report_id");

-- CreateIndex
CREATE INDEX "murojaah_records_student_id_idx" ON "murojaah_records"("student_id");

-- CreateIndex
CREATE INDEX "murojaah_records_murojaah_date_idx" ON "murojaah_records"("murojaah_date");

-- CreateIndex
CREATE INDEX "murojaah_records_murojaah_type_idx" ON "murojaah_records"("murojaah_type");

-- CreateIndex
CREATE INDEX "murojaah_mistakes_murojaah_id_idx" ON "murojaah_mistakes"("murojaah_id");

-- CreateIndex
CREATE INDEX "simaan_exams_student_id_idx" ON "simaan_exams"("student_id");

-- CreateIndex
CREATE INDEX "simaan_exams_exam_date_idx" ON "simaan_exams"("exam_date");

-- CreateIndex
CREATE INDEX "simaan_exams_simaan_type_idx" ON "simaan_exams"("simaan_type");

-- CreateIndex
CREATE INDEX "simaan_examiners_simaan_id_idx" ON "simaan_examiners"("simaan_id");

-- CreateIndex
CREATE INDEX "simaan_examiners_examiner_id_idx" ON "simaan_examiners"("examiner_id");

-- CreateIndex
CREATE INDEX "dashboard_metric_snapshots_unit_id_idx" ON "dashboard_metric_snapshots"("unit_id");

-- CreateIndex
CREATE INDEX "dashboard_metric_snapshots_metric_type_idx" ON "dashboard_metric_snapshots"("metric_type");

-- CreateIndex
CREATE INDEX "dashboard_metric_snapshots_period_date_idx" ON "dashboard_metric_snapshots"("period_date");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_metric_snapshots_unit_id_metric_type_period_type__key" ON "dashboard_metric_snapshots"("unit_id", "metric_type", "period_type", "period_date");

-- CreateIndex
CREATE INDEX "unit_comparison_reports_report_type_idx" ON "unit_comparison_reports"("report_type");

-- CreateIndex
CREATE INDEX "unit_comparison_reports_period_start_period_end_idx" ON "unit_comparison_reports"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "growth_records_student_id_idx" ON "growth_records"("student_id");

-- CreateIndex
CREATE INDEX "growth_records_unit_id_idx" ON "growth_records"("unit_id");

-- CreateIndex
CREATE INDEX "growth_records_record_date_idx" ON "growth_records"("record_date");

-- CreateIndex
CREATE INDEX "immunization_records_student_id_idx" ON "immunization_records"("student_id");

-- CreateIndex
CREATE INDEX "immunization_records_unit_id_idx" ON "immunization_records"("unit_id");

-- CreateIndex
CREATE INDEX "immunization_records_status_idx" ON "immunization_records"("status");

-- CreateIndex
CREATE UNIQUE INDEX "immunization_records_student_id_vaccine_name_dose_number_key" ON "immunization_records"("student_id", "vaccine_name", "dose_number");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_pesantren" ADD CONSTRAINT "rapor_pesantren_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_pesantren" ADD CONSTRAINT "rapor_pesantren_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapor_pesantren" ADD CONSTRAINT "rapor_pesantren_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_development_indicators" ADD CONSTRAINT "paud_development_indicators_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_development_assessments" ADD CONSTRAINT "paud_development_assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_development_assessments" ADD CONSTRAINT "paud_development_assessments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_development_assessments" ADD CONSTRAINT "paud_development_assessments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_development_assessments" ADD CONSTRAINT "paud_development_assessments_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "paud_development_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_development_assessments" ADD CONSTRAINT "paud_development_assessments_assessed_by_id_fkey" FOREIGN KEY ("assessed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_assessment_evidences" ADD CONSTRAINT "paud_assessment_evidences_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "paud_development_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_narrative_reports" ADD CONSTRAINT "paud_narrative_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_narrative_reports" ADD CONSTRAINT "paud_narrative_reports_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_narrative_reports" ADD CONSTRAINT "paud_narrative_reports_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_narrative_reports" ADD CONSTRAINT "paud_narrative_reports_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paud_report_photos" ADD CONSTRAINT "paud_report_photos_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "paud_narrative_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_student_reports" ADD CONSTRAINT "daily_student_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_student_reports" ADD CONSTRAINT "daily_student_reports_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_student_reports" ADD CONSTRAINT "daily_student_reports_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_student_reports" ADD CONSTRAINT "daily_student_reports_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_photos" ADD CONSTRAINT "daily_report_photos_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "daily_student_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_homework" ADD CONSTRAINT "daily_homework_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "daily_student_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murojaah_records" ADD CONSTRAINT "murojaah_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murojaah_records" ADD CONSTRAINT "murojaah_records_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "takhosus_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murojaah_records" ADD CONSTRAINT "murojaah_records_halaqoh_id_fkey" FOREIGN KEY ("halaqoh_id") REFERENCES "halaqoh"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murojaah_records" ADD CONSTRAINT "murojaah_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "murojaah_mistakes" ADD CONSTRAINT "murojaah_mistakes_murojaah_id_fkey" FOREIGN KEY ("murojaah_id") REFERENCES "murojaah_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simaan_exams" ADD CONSTRAINT "simaan_exams_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simaan_exams" ADD CONSTRAINT "simaan_exams_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "takhosus_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simaan_exams" ADD CONSTRAINT "simaan_exams_halaqoh_id_fkey" FOREIGN KEY ("halaqoh_id") REFERENCES "halaqoh"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simaan_examiners" ADD CONSTRAINT "simaan_examiners_simaan_id_fkey" FOREIGN KEY ("simaan_id") REFERENCES "simaan_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simaan_examiners" ADD CONSTRAINT "simaan_examiners_examiner_id_fkey" FOREIGN KEY ("examiner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_metric_snapshots" ADD CONSTRAINT "dashboard_metric_snapshots_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_comparison_reports" ADD CONSTRAINT "unit_comparison_reports_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_comparison_reports" ADD CONSTRAINT "unit_comparison_reports_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_records" ADD CONSTRAINT "growth_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "immunization_records" ADD CONSTRAINT "immunization_records_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
