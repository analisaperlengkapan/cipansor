-- CreateIndex
CREATE UNIQUE INDEX "grades_student_id_exam_id_key" ON "grades"("student_id", "exam_id");
