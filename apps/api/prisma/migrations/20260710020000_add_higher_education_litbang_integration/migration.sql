-- AlterEnum
ALTER TYPE "Realm" ADD VALUE 'PERGURUAN_TINGGI';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RoleCode" ADD VALUE 'PT_REKTOR';
ALTER TYPE "RoleCode" ADD VALUE 'PT_DEKAN';
ALTER TYPE "RoleCode" ADD VALUE 'PT_KAPRODI';
ALTER TYPE "RoleCode" ADD VALUE 'PT_DOSEN';
ALTER TYPE "RoleCode" ADD VALUE 'PT_MAHASISWA';
ALTER TYPE "RoleCode" ADD VALUE 'PT_STAF_AKADEMIK';

-- AlterEnum
ALTER TYPE "UnitType" ADD VALUE 'PERGURUAN_TINGGI';

-- AlterTable
ALTER TABLE "environment_programs" ADD COLUMN     "course_id" TEXT;

-- AlterTable
ALTER TABLE "green_campus_indicators" ADD COLUMN     "carbon_emissions" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "research_projects" ADD COLUMN     "business_unit_id" TEXT,
ADD COLUMN     "impact_notes" TEXT,
ADD COLUMN     "impact_score" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "dean_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_programs" (
    "id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "accreditation" TEXT,
    "head_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "higher_ed_courses" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "credits" INTEGER NOT NULL DEFAULT 2,
    "semester" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "higher_ed_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "higher_ed_course_classes" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lecturer_id" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "higher_ed_course_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students_higher_ed" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "current_semester" INTEGER NOT NULL DEFAULT 1,
    "gpa" DECIMAL(3,2),
    "total_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_higher_ed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "krs" (
    "id" TEXT NOT NULL,
    "student_he_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "krs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "krs_course_enrollments" (
    "id" TEXT NOT NULL,
    "krs_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "grade" DECIMAL(5,2),
    "letter_grade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "krs_course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE INDEX "faculties_unit_id_idx" ON "faculties"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "study_programs_code_key" ON "study_programs"("code");

-- CreateIndex
CREATE INDEX "study_programs_faculty_id_idx" ON "study_programs"("faculty_id");

-- CreateIndex
CREATE UNIQUE INDEX "higher_ed_courses_code_key" ON "higher_ed_courses"("code");

-- CreateIndex
CREATE INDEX "higher_ed_courses_program_id_idx" ON "higher_ed_courses"("program_id");

-- CreateIndex
CREATE INDEX "higher_ed_course_classes_course_id_idx" ON "higher_ed_course_classes"("course_id");

-- CreateIndex
CREATE INDEX "higher_ed_course_classes_academic_year_id_idx" ON "higher_ed_course_classes"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_higher_ed_student_id_key" ON "students_higher_ed"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_higher_ed_nim_key" ON "students_higher_ed"("nim");

-- CreateIndex
CREATE INDEX "students_higher_ed_program_id_idx" ON "students_higher_ed"("program_id");

-- CreateIndex
CREATE INDEX "krs_student_he_id_idx" ON "krs"("student_he_id");

-- CreateIndex
CREATE UNIQUE INDEX "krs_student_he_id_academic_year_id_semester_key" ON "krs"("student_he_id", "academic_year_id", "semester");

-- CreateIndex
CREATE INDEX "krs_course_enrollments_krs_id_idx" ON "krs_course_enrollments"("krs_id");

-- CreateIndex
CREATE INDEX "krs_course_enrollments_class_id_idx" ON "krs_course_enrollments"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "krs_course_enrollments_krs_id_class_id_key" ON "krs_course_enrollments"("krs_id", "class_id");

-- AddForeignKey
ALTER TABLE "environment_programs" ADD CONSTRAINT "environment_programs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "higher_ed_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "higher_ed_courses" ADD CONSTRAINT "higher_ed_courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "study_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "higher_ed_course_classes" ADD CONSTRAINT "higher_ed_course_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "higher_ed_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "higher_ed_course_classes" ADD CONSTRAINT "higher_ed_course_classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_higher_ed" ADD CONSTRAINT "students_higher_ed_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students_higher_ed" ADD CONSTRAINT "students_higher_ed_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_student_he_id_fkey" FOREIGN KEY ("student_he_id") REFERENCES "students_higher_ed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs" ADD CONSTRAINT "krs_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs_course_enrollments" ADD CONSTRAINT "krs_course_enrollments_krs_id_fkey" FOREIGN KEY ("krs_id") REFERENCES "krs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "krs_course_enrollments" ADD CONSTRAINT "krs_course_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "higher_ed_course_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

