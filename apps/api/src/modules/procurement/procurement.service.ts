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

    // If not Admin, only see own requests
    const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN];
    const isAdmin = role && adminRoles.includes(role);

    if (!isAdmin) {
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

      // 2. Create Assets and Journal Entries
      for (const item of request.items) {
        // Create Asset if category provided
        if (item.assetCategoryId) {
          const assetCode = await generateUniqueCode('AST', 'assets');

          await tx.asset.create({
            data: {
              unitId: request.unitId,
              categoryId: item.assetCategoryId,
              code: assetCode,
              name: item.itemName,
              purchaseDate: new Date(),
              purchasePrice: item.estimatedPrice,
              condition: 'GOOD',
              status: 'ACTIVE',
              notes: `Generated from PR: ${request.code}`
            }
          });
        }

        // 3. Create Journal Entry (Balanced)
        if (item.budgetId && item.budget?.accountId) {
             const expenseAccount = item.budget.accountId;
             // Try to find default Cash account (usually '1101' or '1-1-01')
             // For safety, we search by code '1101' which is standard in this system memory
             const cashAccount = await tx.accountCode.findFirst({
               where: { code: '1101' }
             });

             if (cashAccount) {
               // Debit Expense
               await tx.journalEntry.create({
                  data: {
                      unitId: request.unitId,
                      accountId: expenseAccount,
                      date: new Date(),
                      description: `Purchase Expense: ${item.itemName} (PR: ${request.code})`,
                      debit: item.totalPrice,
                      credit: 0,
                      reference: request.code,
                      referenceType: 'PURCHASE_REQUEST',
                      createdById: userId
                  }
               });

               // Credit Cash
               await tx.journalEntry.create({
                  data: {
                      unitId: request.unitId,
                      accountId: cashAccount.id,
                      date: new Date(),
                      description: `Purchase Payment: ${item.itemName} (PR: ${request.code})`,
                      debit: 0,
                      credit: item.totalPrice,
                      reference: request.code,
                      referenceType: 'PURCHASE_REQUEST',
                      createdById: userId
                  }
               });
             }
        }
      }

      return updatedRequest;
    });
  }
};
