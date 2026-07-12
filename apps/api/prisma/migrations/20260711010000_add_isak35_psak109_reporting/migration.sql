-- AlterTable
ALTER TABLE "account_codes" ADD COLUMN     "net_asset_category" TEXT,
ADD COLUMN     "ziswaf_fund_type" TEXT;

-- CreateTable
CREATE TABLE "report_notes" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "period_id" TEXT,
    "report_type" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_notes_unit_id_period_id_report_type_section_key_key" ON "report_notes"("unit_id", "period_id", "report_type", "section_key");

-- CreateIndex
CREATE UNIQUE INDEX "report_templates_unit_id_type_key" ON "report_templates"("unit_id", "type");

-- AddForeignKey
ALTER TABLE "report_notes" ADD CONSTRAINT "report_notes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_notes" ADD CONSTRAINT "report_notes_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "financial_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

