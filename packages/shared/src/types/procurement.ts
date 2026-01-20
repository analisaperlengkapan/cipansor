import { AssetCategory } from './inventory';
import { Unit } from './models';
import { User } from './auth';

export enum PurchaseRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseRequestItem {
  id: string;
  requestId: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedPrice: number; // Decimal in Prisma, number in JS
  totalPrice: number;
  assetCategoryId?: string | null;
  budgetId?: string | null;

  // Relations
  assetCategory?: AssetCategory | null;
}

export interface PurchaseRequest {
  id: string;
  unitId: string;
  code: string;
  requesterId: string;
  date: Date | string;
  description?: string | null;
  totalEstimated: number;
  status: PurchaseRequestStatus;

  approvedById?: string | null;
  approvedAt?: Date | string | null;
  rejectionReason?: string | null;

  orderedAt?: Date | string | null;
  receivedAt?: Date | string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  unit?: Unit;
  requester?: User;
  approvedBy?: User | null;
  items?: PurchaseRequestItem[];
}

export interface CreatePurchaseRequestItemInput {
  itemName: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  assetCategoryId?: string;
  budgetId?: string;
}

export interface CreatePurchaseRequestInput {
  unitId: string;
  date: Date;
  description?: string;
  items: CreatePurchaseRequestItemInput[];
}

export interface UpdatePurchaseRequestStatusInput {
  status: PurchaseRequestStatus;
  rejectionReason?: string;
}

export interface FulfillPurchaseRequestItemInput {
  itemId: string; // The ID of the PurchaseRequestItem being fulfilled
  quantityReceived: number;
  actualPrice: number;
  condition: 'GOOD' | 'FAIR' | 'POOR'; // Simplified condition enum for input
  roomId?: string; // Location of the asset
  notes?: string;
}

export interface FulfillPurchaseRequestInput {
  items: FulfillPurchaseRequestItemInput[];
  paymentAccountId: string; // Account ID (Cash/Bank)
  receiptDate: Date;
  purchaseOrderNo?: string;
  supplier?: string;
  supplierId?: string;
}
