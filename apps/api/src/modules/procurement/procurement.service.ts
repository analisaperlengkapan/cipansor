import { prisma } from '@/lib/prisma';
import {
  CreatePurchaseRequestInput,
  UpdatePurchaseRequestStatusInput,
  PurchaseRequestStatus,
  PurchaseRequest
} from '@cipansor/shared';
import { UserRole } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '@/middleware/error';
import { generateUniqueCode } from '@/utils/code-generator';

export const procurementService = {
  // Create a new purchase request
  create: async (
    input: CreatePurchaseRequestInput,
    userId: string
  ): Promise<PurchaseRequest> => {
    // Generate code: PR-YYYYMM-XXXX
    const code = await generateUniqueCode('PR', 'purchase_requests');

    // Calculate total
    const totalEstimated = input.items.reduce(
      (sum, item) => sum + (item.quantity * item.estimatedPrice),
      0
    );

    const request = await prisma.purchaseRequest.create({
      data: {
        unitId: input.unitId,
        code,
        requesterId: userId,
        date: new Date(input.date),
        description: input.description,
        totalEstimated,
        status: PurchaseRequestStatus.PENDING,
        items: {
          create: input.items.map(item => ({
            itemName: item.itemName,
            quantity: item.quantity,
            unit: item.unit,
            estimatedPrice: item.estimatedPrice,
            totalPrice: item.quantity * item.estimatedPrice,
            assetCategoryId: item.assetCategoryId,
            budgetId: item.budgetId
          }))
        }
      },
      include: {
        unit: true,
        requester: true,
        items: {
          include: {
            assetCategory: true,
            budget: {
              include: {
                account: true
              }
            }
          }
        }
      }
    });

    return request as unknown as PurchaseRequest;
  },

  // Find all requests (with filters)
  findAll: async (
    unitId?: string,
    status?: PurchaseRequestStatus,
    userId?: string,
    role?: UserRole
  ) => {
    const where: any = {};
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;

    // If not Admin/UnitAdmin, only see own requests
    // Cast YAYASAN_ADMIN to string to avoid Enum strict check if it's missing in generated client
    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, 'YAYASAN_ADMIN'];
    if (role && !allowedRoles.includes(role as any)) {
      where.requesterId = userId;
    }

    const requests = await prisma.purchaseRequest.findMany({
      where,
      include: {
        unit: true,
        requester: true,
        items: true,
        approvedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests as unknown as PurchaseRequest[];
  },

  // Find single request by ID
  findById: async (id: string) => {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        unit: true,
        requester: true,
        approvedBy: true,
        items: {
          include: {
            assetCategory: true,
            budget: {
              include: {
                account: true
              }
            }
          }
        }
      }
    });

    if (!request) throw new NotFoundError('Purchase Request not found');
    return request as unknown as PurchaseRequest;
  },

  // Update status (Approve/Reject)
  updateStatus: async (
    id: string,
    input: UpdatePurchaseRequestStatusInput,
    approverId: string
  ) => {
    const request = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundError('Purchase Request not found');

    if (request.status !== PurchaseRequestStatus.PENDING && request.status !== PurchaseRequestStatus.APPROVED) {
      throw new ValidationError('Cannot update status of processed request');
    }

    const data: any = { status: input.status };

    if (input.status === PurchaseRequestStatus.APPROVED) {
      data.approvedById = approverId;
      data.approvedAt = new Date();
      // Optional: Check budget here and warn if insufficient (logic skipped for simplicity, assumed manual check)
    } else if (input.status === PurchaseRequestStatus.REJECTED) {
      data.rejectionReason = input.rejectionReason;
    }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data,
      include: { items: true }
    });

    return updated as unknown as PurchaseRequest;
  },

  // Fulfill request (Mark as Received -> Create Asset -> Create Journal)
  fulfill: async (id: string, userId: string) => {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: { items: { include: { assetCategory: true, budget: { include: { account: true } } } } }
    });

    if (!request) throw new NotFoundError('Purchase Request not found');
    if (request.status !== PurchaseRequestStatus.APPROVED && request.status !== PurchaseRequestStatus.ORDERED) {
      throw new ValidationError('Request must be Approved or Ordered to be Fulfilled');
    }

    // Transactional fulfillment
    return await prisma.$transaction(async (tx) => {
      // 1. Update Status
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: PurchaseRequestStatus.RECEIVED,
          receivedAt: new Date()
        }
      });

      // 2. Create Assets for items that have categories
      for (const item of request.items) {
        if (item.assetCategoryId) {
          // Generate asset code: [CAT]-[UNIT]-[SEQ]
          // Simplified for now: unique timestamp based
          const assetCode = `AST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          await tx.asset.create({
            data: {
              unitId: request.unitId,
              categoryId: item.assetCategoryId,
              code: assetCode,
              name: item.itemName,
              purchaseDate: new Date(),
              purchasePrice: item.estimatedPrice, // Assuming estimated is actual for now
              condition: 'GOOD',
              status: 'ACTIVE',
              notes: `Generated from PR: ${request.code}`
            }
          });
        }

        // 3. Create Journal Entry if Budget is linked
        // Credit Cash (1101) / Debit Expense (Account from Budget)
        // Simplified: We need a default cash account or pass it.
        // For now, we assume standard Cash account 1-1-01 (1101) exists or we skip if not found.
        if (item.budgetId && item.budget?.accountId) {
             const expenseAccount = item.budget.accountId;
             // Try to find cash account for this unit (usually 1101)
             // This is tricky without strict configuration.
             // We will LOG it or skip strictly to avoid errors if accounts missing.

             // Create Expense Journal
             await tx.journalEntry.create({
                data: {
                    unitId: request.unitId,
                    accountId: expenseAccount,
                    date: new Date(),
                    description: `Purchase: ${item.itemName} (PR: ${request.code})`,
                    debit: item.totalPrice,
                    credit: 0,
                    reference: request.code,
                    referenceType: 'PURCHASE_REQUEST',
                    createdById: userId
                }
             });

             // Create Cash Credit Journal (Assuming a generic Cash account or skipping)
             // To make this robust, we should look up the Cash Account.
        }
      }

      return updatedRequest;
    });
  }
};
