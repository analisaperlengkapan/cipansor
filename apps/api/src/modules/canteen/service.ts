import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { JournalReferenceType } from '@cipansor/shared';
import { getAccountOrFallback, ACCOUNT_MAPPING_KEYS } from '../finance/accounting-config.service';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateItemInput,
  UpdateItemInput,
  ListItemsQuery,
  CreateTransactionInput,
  UpdateTransactionStatusInput,
  ListTransactionsQuery,
  CreateStockMovementInput,
  ListStockMovementsQuery,
} from './canteen.schema';

// =============================================================================
// CATEGORY SERVICE
// =============================================================================

export const categoryService = {
  async getAll(unitId: string, businessUnitId?: string) {
    return prisma.canteenCategory.findMany({
      where: {
        unitId,
        ...(businessUnitId && { businessUnitId }),
      },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },

  async getById(id: string, unitId: string) {
    return prisma.canteenCategory.findFirst({
      where: { id, unitId },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });
  },

  async create(unitId: string, data: CreateCategoryInput) {
    return prisma.canteenCategory.create({
      data: {
        unit: { connect: { id: unitId } },
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        ...(data.businessUnitId && { businessUnit: { connect: { id: data.businessUnitId } } }),
      },
    });
  },

  async update(id: string, unitId: string, data: UpdateCategoryInput) {
    const { businessUnitId, ...rest } = data;
    return prisma.canteenCategory.update({
      where: { id },
      data: {
        ...rest,
        ...(businessUnitId !== undefined && {
          businessUnit: businessUnitId
            ? { connect: { id: businessUnitId } }
            : { disconnect: true },
        }),
      },
    });
  },

  async delete(id: string, unitId: string) {
    // Check if category has items
    const itemCount = await prisma.canteenItem.count({
      where: { categoryId: id, unitId },
    });

    if (itemCount > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena memiliki ${itemCount} item`);
    }

    return prisma.canteenCategory.delete({
      where: { id },
    });
  },
};

// =============================================================================
// ITEM SERVICE
// =============================================================================

export const itemService = {
  async getAll(unitId: string, query: ListItemsQuery) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: Prisma.CanteenItemWhereInput = {
      unitId,
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.businessUnitId && { businessUnitId: query.businessUnitId }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.isAvailable && { isAvailable: query.isAvailable === 'true' }),
      ...(query.isActive && { isActive: query.isActive === 'true' }),
      ...(query.lowStock === 'true' && {
        stock: { lte: prisma.canteenItem.fields.minStock },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.canteenItem.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.canteenItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string, unitId: string) {
    return prisma.canteenItem.findFirst({
      where: { id, unitId },
      include: {
        category: true,
        _count: {
          select: { transactionItems: true, stockMovements: true },
        },
      },
    });
  },

  async getLowStockItems(unitId: string) {
    return prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        code: string | null;
        stock: number;
        minStock: number;
        categoryName: string;
      }>
    >`
      SELECT 
        i.id, i.name, i.code, i.stock, i.min_stock as "minStock",
        c.name as "categoryName"
      FROM canteen_items i
      JOIN canteen_categories c ON i.category_id = c.id
      WHERE i.unit_id = ${unitId}
        AND i.is_active = true
        AND i.stock <= i.min_stock
      ORDER BY i.stock ASC
    `;
  },

  async create(unitId: string, data: CreateItemInput) {
    return prisma.canteenItem.create({
      data: {
        unitRel: { connect: { id: unitId } },
        category: { connect: { id: data.categoryId } },
        ...(data.businessUnitId && { businessUnit: { connect: { id: data.businessUnitId } } }),
        code: data.code,
        name: data.name,
        description: data.description,
        price: new Prisma.Decimal(data.price),
        costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : null,
        stock: data.stock,
        minStock: data.minStock,
        unit: data.unit,
        imageUrl: data.imageUrl,
        isAvailable: data.isAvailable,
        isActive: data.isActive,
      },
      include: {
        category: true,
      },
    });
  },

  async update(id: string, unitId: string, data: UpdateItemInput) {
    const updateData: Prisma.CanteenItemUpdateInput = {};

    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.businessUnitId !== undefined) {
      updateData.businessUnit = data.businessUnitId
        ? { connect: { id: data.businessUnitId } }
        : { disconnect: true };
    }
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = new Prisma.Decimal(data.price);
    if (data.costPrice !== undefined)
      updateData.costPrice = data.costPrice ? new Prisma.Decimal(data.costPrice) : null;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.minStock !== undefined) updateData.minStock = data.minStock;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.canteenItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });
  },

  async delete(id: string, unitId: string) {
    // Check if item has transactions
    const transactionCount = await prisma.canteenTransactionItem.count({
      where: { itemId: id },
    });

    if (transactionCount > 0) {
      // Soft delete - just mark as inactive
      return prisma.canteenItem.update({
        where: { id },
        data: { isActive: false, isAvailable: false },
      });
    }

    return prisma.canteenItem.delete({
      where: { id },
    });
  },
};

// =============================================================================
// TRANSACTION SERVICE
// =============================================================================

const generateTransactionNo = async (unitId: string, tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0] = prisma): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CNT-${dateStr}`;

  const lastTransaction = await tx.canteenTransaction.findFirst({
    where: { transactionNo: { startsWith: prefix } },
    orderBy: { transactionNo: 'desc' },
    select: { transactionNo: true },
  });

  let sequence = 1;
  if (lastTransaction) {
    const lastSeq = parseInt(lastTransaction.transactionNo.split('-')[2]);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
};

export const transactionService = {
  async getAll(unitId: string, query: ListTransactionsQuery) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: Prisma.CanteenTransactionWhereInput = {
      unitId,
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.status && { status: query.status }),
      ...(query.paymentMethod && { paymentMethod: query.paymentMethod }),
      ...(query.startDate &&
        query.endDate && {
          createdAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate + 'T23:59:59.999Z'),
          },
        }),
    };

    const [transactions, total] = await Promise.all([
      prisma.canteenTransaction.findMany({
        where,
        include: {
          student: {
            select: { id: true, nis: true, user: { select: { name: true } } },
          },
          cashier: { select: { id: true, name: true } },
          items: {
            include: { item: { select: { id: true, name: true, code: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.canteenTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string, unitId: string) {
    return prisma.canteenTransaction.findFirst({
      where: { id, unitId },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            user: { select: { name: true } },
            wallet: { select: { balance: true } },
          },
        },
        cashier: { select: { id: true, name: true } },
        items: {
          include: { item: { select: { id: true, name: true, code: true, imageUrl: true } } },
        },
      },
    });
  },

  async create(unitId: string, cashierId: string, data: CreateTransactionInput & { businessUnitId?: string }) {
    return prisma.$transaction(async (tx) => {
      // Get all items
      const itemIds = data.items.map((i) => i.itemId);
      const items = await tx.canteenItem.findMany({
        where: {
          id: { in: itemIds },
          unitId,
          isAvailable: true,
          isActive: true,
          ...(data.businessUnitId && { businessUnitId: data.businessUnitId }),
        },
      });

      if (items.length !== itemIds.length) {
        throw new Error('Beberapa item tidak tersedia atau tidak termasuk dalam unit usaha yang dipilih');
      }

      // Check stock
      for (const orderItem of data.items) {
        const item = items.find((i) => i.id === orderItem.itemId);
        if (item && item.stock < orderItem.quantity) {
          throw new Error(`Stok ${item.name} tidak mencukupi (tersedia: ${item.stock})`);
        }
      }

      // Calculate totals
      let subtotal = new Prisma.Decimal(0);
      const transactionItems: Array<{
        itemId: string;
        itemName: string;
        quantity: number;
        unitPrice: Prisma.Decimal;
        subtotal: Prisma.Decimal;
        discount: Prisma.Decimal;
        total: Prisma.Decimal;
        notes?: string;
      }> = [];

      for (const orderItem of data.items) {
        const item = items.find((i) => i.id === orderItem.itemId)!;
        const itemSubtotal = item.price.mul(orderItem.quantity);
        subtotal = subtotal.add(itemSubtotal);

        transactionItems.push({
          itemId: item.id,
          itemName: item.name,
          quantity: orderItem.quantity,
          unitPrice: item.price,
          subtotal: itemSubtotal,
          discount: new Prisma.Decimal(0),
          total: itemSubtotal,
          notes: orderItem.notes,
        });
      }

      const discount = new Prisma.Decimal(data.discount || 0);
      const total = subtotal.sub(discount);

      // Handle wallet payment
      let walletId: string | undefined;
      if (data.paymentMethod === 'WALLET' && data.studentId) {
        const wallet = await tx.santriWallet.findUnique({
          where: { studentId: data.studentId },
        });

        if (!wallet) {
          throw new Error('Wallet santri tidak ditemukan');
        }

        if (wallet.balance.lessThan(total)) {
          throw new Error(
            `Saldo wallet tidak mencukupi (saldo: Rp ${wallet.balance.toNumber().toLocaleString('id-ID')})`
          );
        }

        // Deduct wallet balance
        const newBalance = wallet.balance.sub(total);
        await tx.santriWallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance },
        });

        walletId = wallet.id;
      }

      // Generate transaction number (inside tx to reduce race window)
      const transactionNo = await generateTransactionNo(unitId, tx);

      // Create transaction
      const transaction = await tx.canteenTransaction.create({
        data: {
          unitId,
          businessUnitId: data.businessUnitId,
          transactionNo,
          studentId: data.studentId,
          walletId,
          customerName: data.customerName,
          subtotal,
          discount,
          total,
          paymentMethod: data.paymentMethod,
          status: 'COMPLETED',
          notes: data.notes,
          cashierId,
          items: {
            create: transactionItems,
          },
        },
        include: {
          student: {
            select: { id: true, nis: true, user: { select: { name: true } } },
          },
          cashier: { select: { id: true, name: true } },
          items: true,
        },
      });

      // Create wallet transaction if wallet payment
      if (walletId) {
        const wallet = await tx.santriWallet.findUnique({
          where: { id: walletId },
        });

        await tx.walletTransaction.create({
          data: {
            walletId,
            type: 'PURCHASE',
            amount: total,
            balanceBefore: wallet!.balance.add(total),
            balanceAfter: wallet!.balance,
            reference: transaction.id,
            referenceType: 'CANTEEN',
            description: `Pembelian kantin #${transactionNo}`,
            createdById: cashierId,
          },
        });
      }

      // ─── ACCOUNTING INTEGRATION (AUTOMATED JOURNALS) ───
      // We process accounting entries per unit for simple unit-level reports.
      // If businessUnitId is present, we try to use BU-specific account mappings first.

      const accountPrefix = data.businessUnitId ? `BU_${data.businessUnitId}_` : '';

      const salesAccount = await getAccountOrFallback(
        unitId,
        `${accountPrefix}${ACCOUNT_MAPPING_KEYS.SALES_REVENUE}`,
        '4101',
        'Pendapatan Kantin',
        tx
      );

      const inventoryAccount = await getAccountOrFallback(
        unitId,
        `${accountPrefix}${ACCOUNT_MAPPING_KEYS.INVENTORY_ASSET}`,
        '1104',
        'Persediaan',
        tx
      );

      const cogsAccount = await getAccountOrFallback(
        unitId,
        `${accountPrefix}${ACCOUNT_MAPPING_KEYS.COGS}`,
        '5101',
        'Beban Pokok Penjualan Kantin',
        tx
      );

      const cashAccount = await getAccountOrFallback(
        unitId,
        ACCOUNT_MAPPING_KEYS.CASH,
        '1101',
        'Kas',
        tx
      );

      const walletLiabilityAccount = await getAccountOrFallback(
        unitId,
        ACCOUNT_MAPPING_KEYS.WALLET_LIABILITY,
        '2101',
        'Utang Wallet Santri',
        tx
      );

      // 1. Record Revenue & Cash/Wallet Receipt
      const paymentAccount = data.paymentMethod === 'WALLET' ? walletLiabilityAccount : cashAccount;

      if (salesAccount && paymentAccount) {
        // Debit Cash/Wallet
        await tx.journalEntry.create({
          data: {
            unitId,
            accountId: paymentAccount.id,
            date: new Date(),
            description: `Penjualan Kantin #${transactionNo}`,
            debit: total,
            credit: 0,
            reference: transaction.id,
            referenceType: JournalReferenceType.CANTEEN as any,
            createdById: cashierId,
          },
        });

        // Credit Revenue
        await tx.journalEntry.create({
          data: {
            unitId,
            accountId: salesAccount.id,
            date: new Date(),
            description: `Penjualan Kantin #${transactionNo}`,
            debit: 0,
            credit: total,
            reference: transaction.id,
            referenceType: JournalReferenceType.CANTEEN as any,
            createdById: cashierId,
          },
        });
      }

      // Update stock and create stock movements + COGS Journals
      let totalCogs = new Prisma.Decimal(0);

      for (const orderItem of data.items) {
        const item = items.find((i) => i.id === orderItem.itemId)!;
        const newStock = item.stock - orderItem.quantity;
        const itemCogs = (item.costPrice || new Prisma.Decimal(0)).mul(orderItem.quantity);
        totalCogs = totalCogs.add(itemCogs);

        await tx.canteenItem.update({
          where: { id: item.id },
          data: { stock: newStock },
        });

        await tx.canteenStockMovement.create({
          data: {
            itemId: item.id,
            type: 'OUT',
            quantity: orderItem.quantity,
            stockBefore: item.stock,
            stockAfter: newStock,
            reference: transaction.id,
            notes: `Penjualan #${transactionNo}`,
            createdById: cashierId,
          },
        });
      }

      // 2. Record COGS & Inventory Reduction
      if (cogsAccount && inventoryAccount && totalCogs.gt(0)) {
        // Debit COGS
        await tx.journalEntry.create({
          data: {
            unitId,
            accountId: cogsAccount.id,
            date: new Date(),
            description: `BPP Penjualan Kantin #${transactionNo}`,
            debit: totalCogs,
            credit: 0,
            reference: transaction.id,
            referenceType: JournalReferenceType.CANTEEN as any,
            createdById: cashierId,
          },
        });

        // Credit Inventory
        await tx.journalEntry.create({
          data: {
            unitId,
            accountId: inventoryAccount.id,
            date: new Date(),
            description: `Pengurangan Stok Kantin #${transactionNo}`,
            debit: 0,
            credit: totalCogs,
            reference: transaction.id,
            referenceType: JournalReferenceType.CANTEEN as any,
            createdById: cashierId,
          },
        });
      }

      return transaction;
    });
  },

  async updateStatus(
    id: string,
    unitId: string,
    userId: string,
    data: UpdateTransactionStatusInput
  ) {
    return prisma.$transaction(async (tx) => {
      // Acquire an exclusive row lock via SELECT ... FOR UPDATE to prevent
      // concurrent refund requests from both passing the status guard.
      // Prisma doesn't support FOR UPDATE natively, so we use $queryRaw.
      const lockedRows = await tx.$queryRaw<Array<{ id: string; status: string }>>`
        SELECT id, status FROM canteen_transactions
        WHERE id = ${id} AND unit_id = ${unitId}
        FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        throw new Error('Transaksi tidak ditemukan');
      }

      if (data.status === 'REFUNDED' && lockedRows[0].status !== 'COMPLETED') {
        throw new Error('Hanya transaksi COMPLETED yang dapat di-refund');
      }

      // Enforce valid state transitions to prevent data corruption.
      // Re-completing a CANCELLED/REFUNDED transaction is not allowed because
      // the reversal (stock restore, wallet refund, journal reversal) has
      // already been applied and re-completing would not re-deduct them.
      // PENDING → COMPLETED is also disallowed here because the `create` method
      // always creates transactions as COMPLETED with all side-effects (stock
      // deduction, wallet charge, journal entries) processed atomically.
      // Allowing PENDING → COMPLETED via updateStatus would silently skip
      // those side-effects, producing inconsistent inventory and accounting data.
      const VALID_TRANSITIONS: Record<string, string[]> = {
        PENDING: ['CANCELLED'],
        COMPLETED: ['REFUNDED', 'CANCELLED'],
        CANCELLED: [],   // Terminal state
        REFUNDED: [],     // Terminal state
      };

      const currentStatus = lockedRows[0].status;
      const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(data.status)) {
        throw new Error(
          `Transisi status dari ${currentStatus} ke ${data.status} tidak diperbolehkan`
        );
      }

      // Now safe to read the full transaction — the row is locked.
      const transaction = await tx.canteenTransaction.findFirst({
        where: { id, unitId },
        include: { items: true },
      });

      if (!transaction) {
        throw new Error('Transaksi tidak ditemukan');
      }

      // Handle refund or cancellation of a COMPLETED transaction.
      // Both cases need to restore wallet balance and stock so that the
      // physical inventory and wallet ledger stay in sync with the
      // reversing journal entries created further below.
      const shouldReverse =
        data.status === 'REFUNDED' ||
        (data.status === 'CANCELLED' && lockedRows[0].status === 'COMPLETED');

      if (shouldReverse) {
        // Refund to wallet if original payment was wallet
        if (transaction.walletId) {
          const wallet = await tx.santriWallet.findUnique({
            where: { id: transaction.walletId },
          });

          if (wallet) {
            const newBalance = wallet.balance.add(transaction.total);
            await tx.santriWallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'REFUND',
                amount: transaction.total,
                balanceBefore: wallet.balance,
                balanceAfter: newBalance,
                reference: transaction.id,
                referenceType: 'CANTEEN',
                description: `${data.status === 'REFUNDED' ? 'Refund' : 'Pembatalan'} transaksi #${transaction.transactionNo}`,
                createdById: userId,
              },
            });
          }
        }

        // Restore stock
        for (const item of transaction.items) {
          const currentItem = await tx.canteenItem.findUnique({
            where: { id: item.itemId },
          });

          if (currentItem) {
            const newStock = currentItem.stock + item.quantity;
            await tx.canteenItem.update({
              where: { id: item.itemId },
              data: { stock: newStock },
            });

            await tx.canteenStockMovement.create({
              data: {
                itemId: item.itemId,
                type: 'IN',
                quantity: item.quantity,
                stockBefore: currentItem.stock,
                stockAfter: newStock,
                reference: transaction.id,
                notes: `${data.status === 'REFUNDED' ? 'Refund' : 'Pembatalan'} transaksi #${transaction.transactionNo}`,
                createdById: userId,
              },
            });
          }
        }
      }

      // ─── REVERSING JOURNAL ENTRIES FOR REFUND / CANCELLATION ───
      // Look up the *original* journal entries by transaction reference so that
      // reversals always target the exact same accounts and amounts that were
      // recorded at sale time, even if account mappings have been changed since.
      //
      // Reversal entries use a `REFUND:` / `CANCEL:` prefix on the reference
      // field so they are distinguishable from the originals.  This prevents a
      // (now-unlikely but still theoretically possible) double-reversal if a
      // second request were to read both originals and prior reversals.
      if (data.status === 'REFUNDED' || (data.status === 'CANCELLED' && lockedRows[0].status === 'COMPLETED')) {
        const reversalPrefix = data.status === 'REFUNDED' ? 'REFUND' : 'CANCEL';
        const refundReference = `${reversalPrefix}:${transaction.id}`;

        const originalEntries = await tx.journalEntry.findMany({
          where: {
            reference: transaction.id,
            referenceType: JournalReferenceType.CANTEEN as any,
          },
          select: { accountId: true, debit: true, credit: true, description: true },
        });

        for (const entry of originalEntries) {
          // Swap debit ↔ credit to create the reversing entry
          await tx.journalEntry.create({
            data: {
              unitId,
              accountId: entry.accountId,
              date: new Date(),
              description: `${data.status === 'REFUNDED' ? 'Refund' : 'Pembatalan'} ${entry.description || ''} #${transaction.transactionNo}`,
              debit: entry.credit,
              credit: entry.debit,
              reference: refundReference,
              referenceType: JournalReferenceType.CANTEEN as any,
              createdById: userId,
            },
          });
        }
      }

      return tx.canteenTransaction.update({
        where: { id },
        data: {
          status: data.status,
          notes: data.notes ? `${transaction.notes || ''}\n${data.notes}` : transaction.notes,
        },
      });
    });
  },

  async getStats(unitId: string, startDate?: string, endDate?: string) {
    const dateFilter =
      startDate && endDate
        ? {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate + 'T23:59:59.999Z'),
            },
          }
        : {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          };

    const [todayStats, totalTransactions, topItems, paymentBreakdown] = await Promise.all([
      prisma.canteenTransaction.aggregate({
        where: { unitId, status: 'COMPLETED', ...dateFilter },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.canteenTransaction.count({
        where: { unitId },
      }),
      prisma.canteenTransactionItem.groupBy({
        by: ['itemId', 'itemName'],
        where: {
          transaction: { unitId, status: 'COMPLETED', ...dateFilter },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.canteenTransaction.groupBy({
        by: ['paymentMethod'],
        where: { unitId, status: 'COMPLETED', ...dateFilter },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    return {
      period: {
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate: endDate || new Date().toISOString().slice(0, 10),
      },
      summary: {
        totalRevenue: todayStats._sum.total?.toNumber() || 0,
        totalTransactions: todayStats._count.id,
        allTimeTransactions: totalTransactions,
      },
      topItems: topItems.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantitySold: item._sum.quantity || 0,
        totalRevenue: item._sum.total?.toNumber() || 0,
      })),
      paymentBreakdown: paymentBreakdown.map((p) => ({
        method: p.paymentMethod,
        count: p._count.id,
        total: p._sum.total?.toNumber() || 0,
      })),
    };
  },
};

// =============================================================================
// STOCK MOVEMENT SERVICE
// =============================================================================

export const stockMovementService = {
  async getAll(unitId: string, query: ListStockMovementsQuery) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const where: Prisma.CanteenStockMovementWhereInput = {
      item: { unitId },
      ...(query.itemId && { itemId: query.itemId }),
      ...(query.type && { type: query.type }),
      ...(query.startDate &&
        query.endDate && {
          createdAt: {
            gte: new Date(query.startDate),
            lte: new Date(query.endDate + 'T23:59:59.999Z'),
          },
        }),
    };

    const [movements, total] = await Promise.all([
      prisma.canteenStockMovement.findMany({
        where,
        include: {
          item: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.canteenStockMovement.count({ where }),
    ]);

    return {
      data: movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async create(unitId: string, userId: string, data: CreateStockMovementInput) {
    const item = await prisma.canteenItem.findFirst({
      where: { id: data.itemId, unitId },
    });

    if (!item) {
      throw new Error('Item tidak ditemukan');
    }

    return prisma.$transaction(async (tx) => {
      let newStock: number;

      switch (data.type) {
        case 'IN':
          newStock = item.stock + data.quantity;
          break;
        case 'OUT':
        case 'EXPIRED':
          if (item.stock < data.quantity) {
            throw new Error(`Stok tidak mencukupi (tersedia: ${item.stock})`);
          }
          newStock = item.stock - data.quantity;
          break;
        case 'ADJUSTMENT':
          newStock = data.quantity; // For adjustment, quantity is the new stock value
          break;
        default:
          throw new Error('Tipe pergerakan tidak valid');
      }

      await tx.canteenItem.update({
        where: { id: item.id },
        data: { stock: newStock },
      });

      return tx.canteenStockMovement.create({
        data: {
          itemId: item.id,
          type: data.type,
          quantity: data.type === 'ADJUSTMENT' ? Math.abs(newStock - item.stock) : data.quantity,
          stockBefore: item.stock,
          stockAfter: newStock,
          notes: data.notes,
          createdById: userId,
        },
        include: {
          item: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    });
  },
};
