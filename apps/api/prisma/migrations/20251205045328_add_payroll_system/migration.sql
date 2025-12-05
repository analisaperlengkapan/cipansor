-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "salary_components" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "description" TEXT,
    "is_fixed" BOOLEAN NOT NULL DEFAULT true,
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "percentage_of" TEXT,
    "default_amount" DECIMAL(15,2),
    "default_rate" DECIMAL(5,4),
    "is_taxable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_salaries" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "base_salary" DECIMAL(15,2) NOT NULL,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_holder" TEXT,
    "tax_status" TEXT NOT NULL DEFAULT 'TK/0',
    "npwp" TEXT,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_salaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_salary_items" (
    "id" TEXT NOT NULL,
    "salary_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "rate" DECIMAL(5,4),
    "notes" TEXT,

    CONSTRAINT "employee_salary_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "pay_date" TIMESTAMP(3),
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "employee_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "employee_no" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "department" TEXT,
    "position" TEXT,
    "base_salary" DECIMAL(15,2) NOT NULL,
    "total_earnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(15,2) NOT NULL,
    "taxable_income" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_status" TEXT,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "bank_holder" TEXT,
    "work_days" INTEGER NOT NULL DEFAULT 0,
    "present_days" INTEGER NOT NULL DEFAULT 0,
    "absent_days" INTEGER NOT NULL DEFAULT 0,
    "late_days" INTEGER NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "component_code" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "rate" DECIMAL(5,4),
    "base_amount" DECIMAL(15,2),
    "notes" TEXT,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salary_components_code_key" ON "salary_components"("code");

-- CreateIndex
CREATE INDEX "salary_components_type_idx" ON "salary_components"("type");

-- CreateIndex
CREATE INDEX "salary_components_code_idx" ON "salary_components"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_salaries_staff_id_key" ON "employee_salaries"("staff_id");

-- CreateIndex
CREATE INDEX "employee_salaries_staff_id_idx" ON "employee_salaries"("staff_id");

-- CreateIndex
CREATE INDEX "employee_salary_items_salary_id_idx" ON "employee_salary_items"("salary_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_salary_items_salary_id_component_id_key" ON "employee_salary_items"("salary_id", "component_id");

-- CreateIndex
CREATE INDEX "payroll_periods_unit_id_idx" ON "payroll_periods"("unit_id");

-- CreateIndex
CREATE INDEX "payroll_periods_status_idx" ON "payroll_periods"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_unit_id_month_year_key" ON "payroll_periods"("unit_id", "month", "year");

-- CreateIndex
CREATE INDEX "payrolls_period_id_idx" ON "payrolls"("period_id");

-- CreateIndex
CREATE INDEX "payrolls_staff_id_idx" ON "payrolls"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_period_id_staff_id_key" ON "payrolls"("period_id", "staff_id");

-- CreateIndex
CREATE INDEX "payroll_items_payroll_id_idx" ON "payroll_items"("payroll_id");

-- AddForeignKey
ALTER TABLE "employee_salaries" ADD CONSTRAINT "employee_salaries_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_salary_items" ADD CONSTRAINT "employee_salary_items_salary_id_fkey" FOREIGN KEY ("salary_id") REFERENCES "employee_salaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_salary_items" ADD CONSTRAINT "employee_salary_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "payroll_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "salary_components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
