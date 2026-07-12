-- Practicum (Amaliyah Tadris), Qiyadah (student org), Turats Lab (research) — from PR #295, hardened

-- CreateEnum
CREATE TYPE "PracticumStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'REVISION_REQUIRED', 'APPROVED', 'COMPLETED');

-- CreateTable practicum_lesson_plans
CREATE TABLE "practicum_lesson_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "materials" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "status" "PracticumStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "practicum_lesson_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "practicum_lesson_plans_student_id_idx" ON "practicum_lesson_plans"("student_id");
CREATE INDEX "practicum_lesson_plans_academic_year_id_idx" ON "practicum_lesson_plans"("academic_year_id");
CREATE INDEX "practicum_lesson_plans_status_idx" ON "practicum_lesson_plans"("status");

ALTER TABLE "practicum_lesson_plans" ADD CONSTRAINT "practicum_lesson_plans_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practicum_lesson_plans" ADD CONSTRAINT "practicum_lesson_plans_academic_year_id_fkey"
  FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "practicum_lesson_plans" ADD CONSTRAINT "practicum_lesson_plans_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable practicum_schedules
CREATE TABLE "practicum_schedules" (
    "id" TEXT NOT NULL,
    "lesson_plan_id" TEXT NOT NULL,
    "target_class_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "practicum_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "practicum_schedules_lesson_plan_id_idx" ON "practicum_schedules"("lesson_plan_id");

ALTER TABLE "practicum_schedules" ADD CONSTRAINT "practicum_schedules_lesson_plan_id_fkey"
  FOREIGN KEY ("lesson_plan_id") REFERENCES "practicum_lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practicum_schedules" ADD CONSTRAINT "practicum_schedules_target_class_id_fkey"
  FOREIGN KEY ("target_class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable practicum_evaluations
CREATE TABLE "practicum_evaluations" (
    "id" TEXT NOT NULL,
    "lesson_plan_id" TEXT NOT NULL,
    "evaluator_id" TEXT NOT NULL,
    "is_peer" BOOLEAN NOT NULL DEFAULT false,
    "method_score" DOUBLE PRECISION NOT NULL,
    "content_score" DOUBLE PRECISION NOT NULL,
    "language_score" DOUBLE PRECISION NOT NULL,
    "performance_score" DOUBLE PRECISION NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "practicum_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "practicum_evaluations_lesson_plan_id_idx" ON "practicum_evaluations"("lesson_plan_id");

ALTER TABLE "practicum_evaluations" ADD CONSTRAINT "practicum_evaluations_lesson_plan_id_fkey"
  FOREIGN KEY ("lesson_plan_id") REFERENCES "practicum_lesson_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "practicum_evaluations" ADD CONSTRAINT "practicum_evaluations_evaluator_id_fkey"
  FOREIGN KEY ("evaluator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable student_orgs
CREATE TABLE "student_orgs" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_orgs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_orgs_unit_id_idx" ON "student_orgs"("unit_id");

ALTER TABLE "student_orgs" ADD CONSTRAINT "student_orgs_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_orgs" ADD CONSTRAINT "student_orgs_academic_year_id_fkey"
  FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable student_org_positions
CREATE TABLE "student_org_positions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_org_positions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_org_positions_org_id_idx" ON "student_org_positions"("org_id");

ALTER TABLE "student_org_positions" ADD CONSTRAINT "student_org_positions_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "student_orgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable student_org_members
CREATE TABLE "student_org_members" (
    "id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_org_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_org_members_position_id_student_id_key" ON "student_org_members"("position_id", "student_id");
CREATE INDEX "student_org_members_student_id_idx" ON "student_org_members"("student_id");

ALTER TABLE "student_org_members" ADD CONSTRAINT "student_org_members_position_id_fkey"
  FOREIGN KEY ("position_id") REFERENCES "student_org_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_org_members" ADD CONSTRAINT "student_org_members_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable student_org_logbooks
CREATE TABLE "student_org_logbooks" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "activity" TEXT NOT NULL,
    "result" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_org_logbooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_org_logbooks_member_id_idx" ON "student_org_logbooks"("member_id");
CREATE INDEX "student_org_logbooks_date_idx" ON "student_org_logbooks"("date");

ALTER TABLE "student_org_logbooks" ADD CONSTRAINT "student_org_logbooks_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "student_org_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable research_themes
CREATE TABLE "research_themes" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "research_themes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "research_themes_unit_id_idx" ON "research_themes"("unit_id");

ALTER TABLE "research_themes" ADD CONSTRAINT "research_themes_unit_id_fkey"
  FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "research_themes" ADD CONSTRAINT "research_themes_academic_year_id_fkey"
  FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable research_submissions
CREATE TABLE "research_submissions" (
    "id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "feedback" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "research_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "research_submissions_theme_id_idx" ON "research_submissions"("theme_id");
CREATE INDEX "research_submissions_student_id_idx" ON "research_submissions"("student_id");

ALTER TABLE "research_submissions" ADD CONSTRAINT "research_submissions_theme_id_fkey"
  FOREIGN KEY ("theme_id") REFERENCES "research_themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_submissions" ADD CONSTRAINT "research_submissions_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_submissions" ADD CONSTRAINT "research_submissions_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable research_references
CREATE TABLE "research_references" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "book_title" TEXT NOT NULL,
    "author" TEXT,
    "volume" TEXT,
    "page" TEXT,
    "content_quote" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "research_references_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "research_references_submission_id_idx" ON "research_references"("submission_id");

ALTER TABLE "research_references" ADD CONSTRAINT "research_references_submission_id_fkey"
  FOREIGN KEY ("submission_id") REFERENCES "research_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
