import { prisma } from '@/lib/prisma';
import {
  CreatePurchaseRequestInput,
  UpdatePurchaseRequestStatusInput,
  PurchaseRequestStatus,
  PurchaseRequest,
  FulfillPurchaseRequestInput
} from '@cipansor/shared';
import { UserRole, AssetCondition } from '@prisma/client';
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
  fulfill: async (id: string, input: FulfillPurchaseRequestInput, userId: string) => {
    const request = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: { items: { include: { assetCategory: true, budget: { include: { account: true } } } } }
    });

    if (!request) throw new NotFoundError('Purchase Request not found');
    if (request.status !== PurchaseRequestStatus.APPROVED && request.status !== PurchaseRequestStatus.ORDERED) {
      throw new ValidationError('Request must be Approved or Ordered to be Fulfilled');
    }

    // Validate payment account
    const paymentAccount = await prisma.accountCode.findUnique({
      where: { id: input.paymentAccountId }
    });
    if (!paymentAccount) {
      throw new ValidationError('Invalid payment account');
    }

    // Transactional fulfillment
    return await prisma.$transaction(async (tx) => {
      // 1. Update Status
      const updatedRequest = await tx.purchaseRequest.update({
        where: { id },
        data: {
          status: PurchaseRequestStatus.RECEIVED,
          receivedAt: new Date(input.receiptDate)
        }
      });

      // 2. Process Items
      for (const fulfillmentItem of input.items) {
        const prItem = request.items.find(i => i.id === fulfillmentItem.itemId);
        if (!prItem) continue;

        const totalItemPrice = fulfillmentItem.quantityReceived * fulfillmentItem.actualPrice;

        // Create Asset if category provided
        if (prItem.assetCategoryId) {
          // Loop based on quantity received to create individual assets
          for (let i = 0; i < fulfillmentItem.quantityReceived; i++) {
            const assetCode = await generateUniqueCode('AST', 'assets');

            // Map simplified condition to Prisma Enum
            let condition: AssetCondition = AssetCondition.GOOD;
            if (fulfillmentItem.condition === 'FAIR') condition = AssetCondition.FAIR;
            if (fulfillmentItem.condition === 'POOR') condition = AssetCondition.POOR;

            await tx.asset.create({
              data: {
                unitId: request.unitId,
                categoryId: prItem.assetCategoryId,
                code: assetCode,
                name: `${prItem.itemName} (${i + 1})`,
                purchaseDate: new Date(input.receiptDate),
                purchasePrice: fulfillmentItem.actualPrice,
                condition: condition,
                status: 'ACTIVE',
                notes: fulfillmentItem.notes || `Generated from PR: ${request.code}`,
                purchaseOrderNo: input.purchaseOrderNo,
                supplier: input.supplier
              }
            });
          }
        }

        // 3. Create Journal Entry (Balanced)
        // Debit: Expense Account (from Budget) OR Asset Clearing Account
        // Credit: Payment Account (from Input)
        if (prItem.budgetId && prItem.budget?.accountId) {
             const debitAccount = prItem.budget.accountId;

             // Update Budget Used Amount
             await tx.budget.update({
               where: { id: prItem.budgetId },
               data: {
                 usedAmount: { increment: totalItemPrice }
               }
             });

             // Debit Entry
             await tx.journalEntry.create({
                data: {
                    unitId: request.unitId,
                    accountId: debitAccount,
                    date: new Date(input.receiptDate),
                    description: `Purchase: ${prItem.itemName} (PR: ${request.code}) - Qty: ${fulfillmentItem.quantityReceived}`,
                    debit: totalItemPrice,
                    credit: 0,
                    reference: request.code,
                    referenceType: 'PURCHASE_REQUEST',
                    createdById: userId
                }
             });

             // Credit Entry (Payment)
             await tx.journalEntry.create({
                data: {
                    unitId: request.unitId,
                    accountId: paymentAccount.id,
                    date: new Date(input.receiptDate),
                    description: `Payment: ${prItem.itemName} (PR: ${request.code})`,
                    debit: 0,
                    credit: totalItemPrice,
                    reference: request.code,
                    referenceType: 'PURCHASE_REQUEST',
                    createdById: userId
                }
             });
        }
      }

      return updatedRequest;
    });
  }
};
