import { Request, Response, NextFunction } from 'express';
import { procurementService } from './procurement.service';
import {
  PurchaseRequestStatus,
  CreatePurchaseRequestInput,
  UpdatePurchaseRequestStatusInput,
  FulfillPurchaseRequestInput,
} from '@cipansor/shared';
import { z } from 'zod';

// Zod Schemas for Validation
const createItemSchema = z.object({
  itemName: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: z.string().min(1),
  estimatedPrice: z.number().positive(),
  assetCategoryId: z.string().optional(),
  budgetId: z.string().optional(),
});

const createRequestSchema = z.object({
  unitId: z.string().uuid(),
  date: z.string().datetime().or(z.date()),
  description: z.string().optional(),
  items: z.array(createItemSchema).min(1),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(PurchaseRequestStatus),
  rejectionReason: z.string().optional(),
});

const fulfillItemSchema = z.object({
  itemId: z.string().uuid(),
  quantityReceived: z.number().int().positive(),
  actualPrice: z.number().positive(),
  condition: z.enum(['GOOD', 'FAIR', 'POOR']),
  roomId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const fulfillRequestSchema = z.object({
  items: z.array(fulfillItemSchema).min(1),
  paymentAccountId: z.string().uuid(),
  receiptDate: z.string().datetime().or(z.date()),
  purchaseOrderNo: z.string().optional(),
  supplier: z.string().optional(),
});

export const procurementController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createRequestSchema.parse(req.body);

      const serviceInput: CreatePurchaseRequestInput = {
        unitId: input.unitId,
        date: new Date(input.date),
        description: input.description,
        items: input.items.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          estimatedPrice: item.estimatedPrice,
          assetCategoryId: item.assetCategoryId,
          budgetId: item.budgetId,
        })),
      };

      const result = await procurementService.create(serviceInput, (req as any).user.id);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Purchase Request created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  findAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId, status } = req.query;
      const user = (req as any).user;

      const result = await procurementService.findAll(
        unitId as string,
        status as PurchaseRequestStatus,
        user.id,
        user.role
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  findById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await procurementService.findById(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  getAuditLogs: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await procurementService.getAuditLogs(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const input = updateStatusSchema.parse(req.body);
      const user = (req as any).user;

      const serviceInput: UpdatePurchaseRequestStatusInput = {
        status: input.status,
        rejectionReason: input.rejectionReason,
      };

      const result = await procurementService.updateStatus(id, serviceInput, user.id, user.role);

      res.json({
        success: true,
        data: result,
        message: 'Status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  fulfill: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const input = fulfillRequestSchema.parse(req.body);
      const user = (req as any).user;

      const serviceInput: FulfillPurchaseRequestInput = {
        items: input.items.map(i => ({
          ...i,
          itemId: i.itemId,
          quantityReceived: i.quantityReceived,
          actualPrice: i.actualPrice,
          condition: i.condition,
        })),
        paymentAccountId: input.paymentAccountId,
        receiptDate: new Date(input.receiptDate),
        purchaseOrderNo: input.purchaseOrderNo,
        supplier: input.supplier,
      };

      const result = await procurementService.fulfill(id, serviceInput, user.id);

      res.json({
        success: true,
        data: result,
        message: 'Purchase Request fulfilled. Assets and Journals created.',
      });
    } catch (error) {
      next(error);
    }
  },
};
