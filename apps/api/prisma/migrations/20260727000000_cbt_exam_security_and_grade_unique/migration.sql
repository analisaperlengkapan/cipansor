-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SecurityEventType" AS ENUM ('TAB_SWITCH', 'COPY_PASTE', 'RIGHT_CLICK', 'FULLSCREEN_EXIT', 'DEV_TOOLS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "exam_security_logs" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "event_type" "SecurityEventType" NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exam_security_logs_attempt_id_idx" ON "exam_security_logs"("attempt_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "exam_security_logs" ADD CONSTRAINT "exam_security_logs_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Deduplicate historical duplicate grades keeping the latest updated_at/created_at before adding unique index
DELETE FROM "grades" g1
WHERE g1.exam_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "grades" g2
    WHERE g2.student_id = g1.student_id
      AND g2.exam_id = g1.exam_id
      AND (
        g2.updated_at > g1.updated_at
        OR (g2.updated_at = g1.updated_at AND g2.id > g1.id)
      )
  );

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "grades_student_id_exam_id_key" ON "grades"("student_id", "exam_id");
