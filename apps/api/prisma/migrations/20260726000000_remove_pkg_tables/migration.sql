-- DropForeignKey
ALTER TABLE "pkg_periods" DROP CONSTRAINT "pkg_periods_unit_id_fkey";
ALTER TABLE "pkg_periods" DROP CONSTRAINT "pkg_periods_academic_year_id_fkey";
ALTER TABLE "pkg_evaluations" DROP CONSTRAINT "pkg_evaluations_period_id_fkey";
ALTER TABLE "pkg_evaluations" DROP CONSTRAINT "pkg_evaluations_teacher_id_fkey";
ALTER TABLE "pkg_evaluations" DROP CONSTRAINT "pkg_evaluations_assessor_id_fkey";
ALTER TABLE "pkg_details" DROP CONSTRAINT "pkg_details_evaluation_id_fkey";
ALTER TABLE "pkg_documents" DROP CONSTRAINT "pkg_documents_evaluation_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "pkg_documents";
DROP TABLE IF EXISTS "pkg_details";
DROP TABLE IF EXISTS "pkg_evaluations";
DROP TABLE IF EXISTS "pkg_periods";
