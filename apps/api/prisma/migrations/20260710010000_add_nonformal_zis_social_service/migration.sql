-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MustahikCategory" AS ENUM ('FAKIR', 'MISKIN', 'AMIL', 'MUALAF', 'RIQAB', 'GHARIMIN', 'FISABILILLAH', 'IBNU_SABIL');

-- CreateEnum
CREATE TYPE "SocialServiceType" AS ENUM ('FUNERAL', 'AMBULANCE', 'DISASTER_RELIEF', 'OTHER');

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "duration" INTEGER,
    "instructor_id" TEXT,
    "teacher_id" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "max_participants" INTEGER,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "student_id" TEXT,
    "external_name" TEXT,
    "external_email" TEXT,
    "external_phone" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "invoice_id" TEXT,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_certificates" (
    "id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "certificate_no" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mustahik" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nik" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "category" "MustahikCategory" NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mustahik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zis_distributions" (
    "id" TEXT NOT NULL,
    "mustahik_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "PublicDonationType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "recorded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zis_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_service_orders" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "type" "SocialServiceType" NOT NULL,
    "requester_name" TEXT NOT NULL,
    "requester_phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "PermitStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "total_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "is_subsidized" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_service_teams" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "social_service_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_service_materials" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "user_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "social_service_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_unit_id_idx" ON "courses"("unit_id");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "course_enrollments_invoice_id_key" ON "course_enrollments"("invoice_id");

-- CreateIndex
CREATE INDEX "course_enrollments_course_id_idx" ON "course_enrollments"("course_id");

-- CreateIndex
CREATE INDEX "course_enrollments_student_id_idx" ON "course_enrollments"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_certificates_enrollment_id_key" ON "course_certificates"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_certificates_certificate_no_key" ON "course_certificates"("certificate_no");

-- CreateIndex
CREATE UNIQUE INDEX "mustahik_nik_key" ON "mustahik"("nik");

-- CreateIndex
CREATE INDEX "zis_distributions_mustahik_id_idx" ON "zis_distributions"("mustahik_id");

-- CreateIndex
CREATE INDEX "zis_distributions_date_idx" ON "zis_distributions"("date");

-- CreateIndex
CREATE INDEX "social_service_orders_unit_id_idx" ON "social_service_orders"("unit_id");

-- CreateIndex
CREATE INDEX "social_service_orders_status_idx" ON "social_service_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_service_teams_order_id_user_id_key" ON "social_service_teams"("order_id", "user_id");

-- CreateIndex
CREATE INDEX "social_service_materials_order_id_idx" ON "social_service_materials"("order_id");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zis_distributions" ADD CONSTRAINT "zis_distributions_mustahik_id_fkey" FOREIGN KEY ("mustahik_id") REFERENCES "mustahik"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zis_distributions" ADD CONSTRAINT "zis_distributions_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_service_orders" ADD CONSTRAINT "social_service_orders_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_service_teams" ADD CONSTRAINT "social_service_teams_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "social_service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_service_teams" ADD CONSTRAINT "social_service_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_service_materials" ADD CONSTRAINT "social_service_materials_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "social_service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_service_materials" ADD CONSTRAINT "social_service_materials_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_service_materials" ADD CONSTRAINT "social_service_materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

