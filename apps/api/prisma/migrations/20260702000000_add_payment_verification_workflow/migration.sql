-- CreateEnum
CREATE TYPE "PaymentVerificationStatus" AS ENUM ('PENDING_VERIFICATION', 'TU_APPROVED', 'FINAL_APPROVED', 'REJECTED');

-- AlterTable: push token for the mobile app
ALTER TABLE "users" ADD COLUMN "fcm_token" TEXT;

-- AlterTable: payment-proof upload + two-step (maker-checker) verification.
-- Existing rows were already posted to invoices/journals, so the column
-- default FINAL_APPROVED doubles as the historical backfill.
ALTER TABLE "payments" ADD COLUMN "proof_url" TEXT,
ADD COLUMN "verification_status" "PaymentVerificationStatus" NOT NULL DEFAULT 'FINAL_APPROVED',
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "tu_verified_at" TIMESTAMP(3),
ADD COLUMN "tu_verified_by_id" TEXT,
ADD COLUMN "final_verified_at" TIMESTAMP(3),
ADD COLUMN "final_verified_by_id" TEXT;

-- CreateIndex
CREATE INDEX "payments_verification_status_idx" ON "payments"("verification_status");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tu_verified_by_id_fkey" FOREIGN KEY ("tu_verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_final_verified_by_id_fkey" FOREIGN KEY ("final_verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
