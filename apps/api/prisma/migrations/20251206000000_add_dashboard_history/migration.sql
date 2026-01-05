-- CreateTable
CREATE TABLE "dashboard_history" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT,
    "metrics" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_history_unit_id_idx" ON "dashboard_history"("unit_id");

-- CreateIndex
CREATE INDEX "dashboard_history_created_at_idx" ON "dashboard_history"("created_at");

-- AddForeignKey
ALTER TABLE "dashboard_history" ADD CONSTRAINT "dashboard_history_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
