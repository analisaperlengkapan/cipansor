-- CreateTable
CREATE TABLE "canteen_categories" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canteen_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_items" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "cost_price" DECIMAL(15,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER NOT NULL DEFAULT 5,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canteen_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_transactions" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "transaction_no" TEXT NOT NULL,
    "student_id" TEXT,
    "wallet_id" TEXT,
    "customer_name" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "cashier_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canteen_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_transaction_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "canteen_transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_stock_movements" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canteen_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laundry_pricings" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_per_kg" DECIMAL(15,2) NOT NULL,
    "min_weight" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "process_days" INTEGER NOT NULL DEFAULT 2,
    "is_express" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laundry_transactions" (
    "id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "transaction_no" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "wallet_id" TEXT,
    "pricing_id" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "price_per_kg" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estimated_at" TIMESTAMP(3) NOT NULL,
    "ready_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "notes" TEXT,
    "received_by_id" TEXT NOT NULL,
    "delivered_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laundry_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laundry_items" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "laundry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laundry_status_logs" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "notes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laundry_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canteen_categories_unit_id_idx" ON "canteen_categories"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "canteen_categories_unit_id_name_key" ON "canteen_categories"("unit_id", "name");

-- CreateIndex
CREATE INDEX "canteen_items_unit_id_idx" ON "canteen_items"("unit_id");

-- CreateIndex
CREATE INDEX "canteen_items_category_id_idx" ON "canteen_items"("category_id");

-- CreateIndex
CREATE INDEX "canteen_items_is_available_idx" ON "canteen_items"("is_available");

-- CreateIndex
CREATE UNIQUE INDEX "canteen_items_unit_id_code_key" ON "canteen_items"("unit_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "canteen_transactions_transaction_no_key" ON "canteen_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "canteen_transactions_unit_id_idx" ON "canteen_transactions"("unit_id");

-- CreateIndex
CREATE INDEX "canteen_transactions_student_id_idx" ON "canteen_transactions"("student_id");

-- CreateIndex
CREATE INDEX "canteen_transactions_transaction_no_idx" ON "canteen_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "canteen_transactions_created_at_idx" ON "canteen_transactions"("created_at");

-- CreateIndex
CREATE INDEX "canteen_transactions_status_idx" ON "canteen_transactions"("status");

-- CreateIndex
CREATE INDEX "canteen_transaction_items_transaction_id_idx" ON "canteen_transaction_items"("transaction_id");

-- CreateIndex
CREATE INDEX "canteen_transaction_items_item_id_idx" ON "canteen_transaction_items"("item_id");

-- CreateIndex
CREATE INDEX "canteen_stock_movements_item_id_idx" ON "canteen_stock_movements"("item_id");

-- CreateIndex
CREATE INDEX "canteen_stock_movements_type_idx" ON "canteen_stock_movements"("type");

-- CreateIndex
CREATE INDEX "canteen_stock_movements_created_at_idx" ON "canteen_stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "laundry_pricings_unit_id_idx" ON "laundry_pricings"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_pricings_unit_id_name_key" ON "laundry_pricings"("unit_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "laundry_transactions_transaction_no_key" ON "laundry_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "laundry_transactions_unit_id_idx" ON "laundry_transactions"("unit_id");

-- CreateIndex
CREATE INDEX "laundry_transactions_student_id_idx" ON "laundry_transactions"("student_id");

-- CreateIndex
CREATE INDEX "laundry_transactions_transaction_no_idx" ON "laundry_transactions"("transaction_no");

-- CreateIndex
CREATE INDEX "laundry_transactions_status_idx" ON "laundry_transactions"("status");

-- CreateIndex
CREATE INDEX "laundry_transactions_created_at_idx" ON "laundry_transactions"("created_at");

-- CreateIndex
CREATE INDEX "laundry_items_transaction_id_idx" ON "laundry_items"("transaction_id");

-- CreateIndex
CREATE INDEX "laundry_status_logs_transaction_id_idx" ON "laundry_status_logs"("transaction_id");

-- CreateIndex
CREATE INDEX "laundry_status_logs_created_at_idx" ON "laundry_status_logs"("created_at");

-- AddForeignKey
ALTER TABLE "canteen_categories" ADD CONSTRAINT "canteen_categories_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_items" ADD CONSTRAINT "canteen_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_items" ADD CONSTRAINT "canteen_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "canteen_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_transactions" ADD CONSTRAINT "canteen_transactions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_transactions" ADD CONSTRAINT "canteen_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_transactions" ADD CONSTRAINT "canteen_transactions_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_transaction_items" ADD CONSTRAINT "canteen_transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "canteen_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_transaction_items" ADD CONSTRAINT "canteen_transaction_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "canteen_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_stock_movements" ADD CONSTRAINT "canteen_stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "canteen_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canteen_stock_movements" ADD CONSTRAINT "canteen_stock_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_pricings" ADD CONSTRAINT "laundry_pricings_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_transactions" ADD CONSTRAINT "laundry_transactions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_transactions" ADD CONSTRAINT "laundry_transactions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_transactions" ADD CONSTRAINT "laundry_transactions_pricing_id_fkey" FOREIGN KEY ("pricing_id") REFERENCES "laundry_pricings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_transactions" ADD CONSTRAINT "laundry_transactions_received_by_id_fkey" FOREIGN KEY ("received_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_transactions" ADD CONSTRAINT "laundry_transactions_delivered_by_id_fkey" FOREIGN KEY ("delivered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_items" ADD CONSTRAINT "laundry_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "laundry_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_status_logs" ADD CONSTRAINT "laundry_status_logs_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "laundry_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laundry_status_logs" ADD CONSTRAINT "laundry_status_logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
