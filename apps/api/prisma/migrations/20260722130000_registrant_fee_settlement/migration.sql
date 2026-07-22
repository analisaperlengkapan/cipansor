-- Record that a registrant settled their daftar ulang fee.
--
-- AdmissionPeriod.registrationFee has always said what is owed, but nothing
-- said whether it was paid. Enrollment gated only on status = 'ACCEPTED', so
-- an accepted registrant became a full santri — with an account, a class, a
-- wallet and a medical record — whether or not they had paid.
--
-- Nullable on purpose: existing rows are historical and must not be
-- retroactively marked unpaid or paid. The gate treats NULL as "not settled"
-- only for periods whose registrationFee is greater than zero, so waived and
-- free admissions are unaffected.

ALTER TABLE "registrants"
  ADD COLUMN IF NOT EXISTS "registration_fee_paid_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "registration_fee_amount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "registration_fee_verified_by_id" TEXT,
  ADD COLUMN IF NOT EXISTS "registration_fee_note" TEXT;

-- Registrants already enrolled predate the gate; treat their fee as settled at
-- enrolment time so the new rule does not retroactively invalidate them.
UPDATE "registrants"
   SET "registration_fee_paid_at" = "enrolled_at"
 WHERE "enrolled_at" IS NOT NULL
   AND "registration_fee_paid_at" IS NULL;
