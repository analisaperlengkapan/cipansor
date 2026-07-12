-- CreateEnum
CREATE TYPE "CascadingCategory" AS ENUM ('DIRECT', 'INDIRECT', 'NON_CASCADING');

-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'MASTER_PLAN';

-- AlterTable
ALTER TABLE "strategic_plans" ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "plan_collaborators" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_agreements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "supervisor_pk_id" TEXT,
    "strategic_plan_id" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "total_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behavior_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "revision_notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pk_indicators" (
    "id" TEXT NOT NULL,
    "pk_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" "CascadingCategory" NOT NULL DEFAULT 'NON_CASCADING',
    "ref_indicator_id" TEXT,
    "ref_strategic_indicator_id" TEXT,
    "notes" TEXT,
    "realization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pk_evaluations" (
    "id" TEXT NOT NULL,
    "pk_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "performance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behavior_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "notes" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pk_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pk_indicator_evaluations" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "indicator_id" TEXT NOT NULL,
    "realization" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "activities" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_indicator_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_values" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behavioral_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pk_behavior_evaluations" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "behavior_value_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_behavior_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_collaborators_plan_id_user_id_key" ON "plan_collaborators"("plan_id", "user_id");

-- CreateIndex
CREATE INDEX "performance_agreements_user_id_idx" ON "performance_agreements"("user_id");

-- CreateIndex
CREATE INDEX "performance_agreements_supervisor_id_idx" ON "performance_agreements"("supervisor_id");

-- CreateIndex
CREATE INDEX "performance_agreements_status_idx" ON "performance_agreements"("status");

-- CreateIndex
CREATE INDEX "pk_indicators_pk_id_idx" ON "pk_indicators"("pk_id");

-- CreateIndex
CREATE UNIQUE INDEX "pk_evaluations_pk_id_month_year_key" ON "pk_evaluations"("pk_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "pk_indicator_evaluations_evaluation_id_indicator_id_key" ON "pk_indicator_evaluations"("evaluation_id", "indicator_id");

-- CreateIndex
CREATE UNIQUE INDEX "behavioral_values_name_key" ON "behavioral_values"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pk_behavior_evaluations_evaluation_id_behavior_value_id_key" ON "pk_behavior_evaluations"("evaluation_id", "behavior_value_id");

-- AddForeignKey
ALTER TABLE "strategic_plans" ADD CONSTRAINT "strategic_plans_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "strategic_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_collaborators" ADD CONSTRAINT "plan_collaborators_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "strategic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_collaborators" ADD CONSTRAINT "plan_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_agreements" ADD CONSTRAINT "performance_agreements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_agreements" ADD CONSTRAINT "performance_agreements_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_agreements" ADD CONSTRAINT "performance_agreements_supervisor_pk_id_fkey" FOREIGN KEY ("supervisor_pk_id") REFERENCES "performance_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_agreements" ADD CONSTRAINT "performance_agreements_strategic_plan_id_fkey" FOREIGN KEY ("strategic_plan_id") REFERENCES "strategic_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_indicators" ADD CONSTRAINT "pk_indicators_pk_id_fkey" FOREIGN KEY ("pk_id") REFERENCES "performance_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_indicators" ADD CONSTRAINT "pk_indicators_ref_indicator_id_fkey" FOREIGN KEY ("ref_indicator_id") REFERENCES "pk_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_indicators" ADD CONSTRAINT "pk_indicators_ref_strategic_indicator_id_fkey" FOREIGN KEY ("ref_strategic_indicator_id") REFERENCES "plan_indicators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_evaluations" ADD CONSTRAINT "pk_evaluations_pk_id_fkey" FOREIGN KEY ("pk_id") REFERENCES "performance_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_indicator_evaluations" ADD CONSTRAINT "pk_indicator_evaluations_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "pk_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_indicator_evaluations" ADD CONSTRAINT "pk_indicator_evaluations_indicator_id_fkey" FOREIGN KEY ("indicator_id") REFERENCES "pk_indicators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_behavior_evaluations" ADD CONSTRAINT "pk_behavior_evaluations_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "pk_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pk_behavior_evaluations" ADD CONSTRAINT "pk_behavior_evaluations_behavior_value_id_fkey" FOREIGN KEY ("behavior_value_id") REFERENCES "behavioral_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

