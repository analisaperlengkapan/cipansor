-- AlterTable
ALTER TABLE "exam_attempts" ADD COLUMN "tab_switch_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "exam_security_logs" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_security_logs_attempt_id_idx" ON "exam_security_logs"("attempt_id");

-- AddForeignKey
ALTER TABLE "exam_security_logs" ADD CONSTRAINT "exam_security_logs_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Deduplicate existing grades before creating unique index
DELETE FROM "grades" g1
USING "grades" g2
WHERE g1.id > g2.id
  AND g1.student_id = g2.student_id
  AND g1.exam_id IS NOT NULL
  AND g1.exam_id = g2.exam_id;

-- CreateIndex
CREATE UNIQUE INDEX "grades_student_id_exam_id_key" ON "grades"("student_id", "exam_id");
