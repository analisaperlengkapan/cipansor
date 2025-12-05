-- CreateTable
CREATE TABLE "pkg_periods" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pkg_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pkg_evaluations" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "assessor_id" TEXT,
    "pedagogik_score" DECIMAL(3,2),
    "kepribadian_score" DECIMAL(3,2),
    "sosial_score" DECIMAL(3,2),
    "profesional_score" DECIMAL(3,2),
    "total_score" DECIMAL(5,2),
    "grade" TEXT,
    "credit_points" DECIMAL(5,2),
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "self_assessment_at" TIMESTAMP(3),
    "observed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pkg_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pkg_details" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "competency" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "indicator_name" TEXT NOT NULL,
    "self_score" INTEGER,
    "assessor_score" INTEGER,
    "final_score" INTEGER,
    "evidence" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pkg_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pkg_documents" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pkg_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "reflection" TEXT,
    "academic_year_id" TEXT,
    "subject_id" TEXT,
    "class_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_showcase" BOOLEAN NOT NULL DEFAULT false,
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_files" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portfolio_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_comments" (
    "id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "islamic_events" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "name" TEXT NOT NULL,
    "name_arabic" TEXT,
    "type" TEXT NOT NULL,
    "hijri_month" INTEGER NOT NULL,
    "hijri_day" INTEGER NOT NULL,
    "gregorian_date" TIMESTAMP(3),
    "gregorian_year" INTEGER,
    "description" TEXT,
    "activities" TEXT,
    "is_holiday" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "schedule_adjustment" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "islamic_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_ibadah_targets" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 10,
    "bonus_points" INTEGER NOT NULL DEFAULT 0,
    "target_type" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL DEFAULT 1,
    "target_unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_ibadah_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_ibadah_records" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "actual_count" INTEGER,
    "actual_minutes" INTEGER,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "bonus_earned" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_ibadah_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ibadah_leaderboards" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "period_type" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "bonus_points" INTEGER NOT NULL DEFAULT 0,
    "streak_days" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ibadah_leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pkg_periods_unit_id_idx" ON "pkg_periods"("unit_id");

-- CreateIndex
CREATE INDEX "pkg_periods_academic_year_id_idx" ON "pkg_periods"("academic_year_id");

-- CreateIndex
CREATE INDEX "pkg_evaluations_period_id_idx" ON "pkg_evaluations"("period_id");

-- CreateIndex
CREATE INDEX "pkg_evaluations_teacher_id_idx" ON "pkg_evaluations"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "pkg_evaluations_period_id_teacher_id_key" ON "pkg_evaluations"("period_id", "teacher_id");

-- CreateIndex
CREATE INDEX "pkg_details_evaluation_id_idx" ON "pkg_details"("evaluation_id");

-- CreateIndex
CREATE INDEX "pkg_documents_evaluation_id_idx" ON "pkg_documents"("evaluation_id");

-- CreateIndex
CREATE INDEX "portfolios_student_id_idx" ON "portfolios"("student_id");

-- CreateIndex
CREATE INDEX "portfolios_type_idx" ON "portfolios"("type");

-- CreateIndex
CREATE INDEX "portfolios_academic_year_id_idx" ON "portfolios"("academic_year_id");

-- CreateIndex
CREATE INDEX "portfolio_files_portfolio_id_idx" ON "portfolio_files"("portfolio_id");

-- CreateIndex
CREATE INDEX "portfolio_comments_portfolio_id_idx" ON "portfolio_comments"("portfolio_id");

-- CreateIndex
CREATE INDEX "islamic_events_unit_id_idx" ON "islamic_events"("unit_id");

-- CreateIndex
CREATE INDEX "islamic_events_hijri_month_hijri_day_idx" ON "islamic_events"("hijri_month", "hijri_day");

-- CreateIndex
CREATE INDEX "daily_ibadah_targets_unit_id_idx" ON "daily_ibadah_targets"("unit_id");

-- CreateIndex
CREATE INDEX "daily_ibadah_targets_category_idx" ON "daily_ibadah_targets"("category");

-- CreateIndex
CREATE INDEX "daily_ibadah_records_target_id_idx" ON "daily_ibadah_records"("target_id");

-- CreateIndex
CREATE INDEX "daily_ibadah_records_student_id_idx" ON "daily_ibadah_records"("student_id");

-- CreateIndex
CREATE INDEX "daily_ibadah_records_date_idx" ON "daily_ibadah_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_ibadah_records_target_id_student_id_date_key" ON "daily_ibadah_records"("target_id", "student_id", "date");

-- CreateIndex
CREATE INDEX "ibadah_leaderboards_unit_id_idx" ON "ibadah_leaderboards"("unit_id");

-- CreateIndex
CREATE INDEX "ibadah_leaderboards_student_id_idx" ON "ibadah_leaderboards"("student_id");

-- CreateIndex
CREATE INDEX "ibadah_leaderboards_rank_idx" ON "ibadah_leaderboards"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "ibadah_leaderboards_unit_id_student_id_period_type_period_s_key" ON "ibadah_leaderboards"("unit_id", "student_id", "period_type", "period_start");

-- AddForeignKey
ALTER TABLE "pkg_periods" ADD CONSTRAINT "pkg_periods_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkg_periods" ADD CONSTRAINT "pkg_periods_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkg_evaluations" ADD CONSTRAINT "pkg_evaluations_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "pkg_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkg_evaluations" ADD CONSTRAINT "pkg_evaluations_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkg_evaluations" ADD CONSTRAINT "pkg_evaluations_assessor_id_fkey" FOREIGN KEY ("assessor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkg_details" ADD CONSTRAINT "pkg_details_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "pkg_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pkg_documents" ADD CONSTRAINT "pkg_documents_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "pkg_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_files" ADD CONSTRAINT "portfolio_files_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_comments" ADD CONSTRAINT "portfolio_comments_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_comments" ADD CONSTRAINT "portfolio_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "islamic_events" ADD CONSTRAINT "islamic_events_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_ibadah_targets" ADD CONSTRAINT "daily_ibadah_targets_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_ibadah_records" ADD CONSTRAINT "daily_ibadah_records_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "daily_ibadah_targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_ibadah_records" ADD CONSTRAINT "daily_ibadah_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_ibadah_records" ADD CONSTRAINT "daily_ibadah_records_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ibadah_leaderboards" ADD CONSTRAINT "ibadah_leaderboards_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ibadah_leaderboards" ADD CONSTRAINT "ibadah_leaderboards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
