-- AlterTable: structured psychological observations (counselor-only data)
ALTER TABLE "counseling_sessions" ADD COLUMN "psychology_data" JSONB;

-- AlterTable: academic summary component on the pesantren report card
ALTER TABLE "rapor_pesantren" ADD COLUMN "academic_data" JSONB;
