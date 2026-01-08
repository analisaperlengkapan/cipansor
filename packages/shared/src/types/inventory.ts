export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  DAMAGED = 'DAMAGED',
  DISPOSED = 'DISPOSED',
}

export enum AssetCondition {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  BROKEN = 'BROKEN',
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  _count?: {
    assets: number;
  };
}

export interface Asset {
  id: string;
  unitId: string;
  categoryId: string;
  code: string;
  name: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | string | null;
  purchasePrice?: number | string | null;
  supplier?: string | null;
  location?: string | null;
  roomId?: string | null;
  purchaseOrderNo?: string | null;
  usefulLife?: number | null;
  residualValue?: number | string | null;
  condition: AssetCondition;
  status: AssetStatus;
  warrantyExpiry?: Date | string | null;
  notes?: string | null;
  photoUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Relations
  category?: AssetCategory;
  unit?: { id: string; name: string };
  room?: { id: string; name: string };
  maintenanceLogs?: AssetMaintenance[];
  assignments?: AssetAssignment[];
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  maintenanceDate: Date | string;
  type: string;
  description: string;
  cost?: number | string | null;
  vendor?: string | null;
  performedBy?: string | null;
  nextSchedule?: Date | string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  asset?: Asset;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  userId: string;
  assignedAt: Date | string;
  returnedAt?: Date | string | null;
  dueDate?: Date | string | null;
  conditionBefore: AssetCondition;
  conditionAfter?: AssetCondition | null;
  notes?: string | null;
  status: string; // ACTIVE, RETURNED, OVERDUE

  asset?: Asset;
  user?: { id: string; name: string };
}

export interface AssetAudit {
  id: string;
  unitId: string;
  date: Date | string;
  status: string; // PLANNED, ONGOING, COMPLETED
  notes?: string | null;
  createdById: string;
  createdAt: Date | string;

  unit?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  items?: AssetAuditItem[];
  _count?: { items: number };
}

export interface AssetAuditItem {
  id: string;
  auditId: string;
  assetId: string;
  systemStatus: string;
  actualStatus: string;
  condition: AssetCondition;
  notes?: string | null;
  isMatch: boolean;

  asset?: Asset;
}

// Inputs
export interface CreateAssetCategoryInput {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateAssetCategoryInput extends Partial<CreateAssetCategoryInput> {}

export interface CreateAssetInput {
  unitId: string;
  categoryId: string;
  code: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date | string;
  purchasePrice?: number;
  supplier?: string;
  location?: string;
  roomId?: string;
  purchaseOrderNo?: string;
  usefulLife?: number;
  residualValue?: number;
  condition: AssetCondition;
  status: AssetStatus;
  warrantyExpiry?: Date | string;
  notes?: string;
  photoUrl?: string;
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {}

export interface CreateAssetMaintenanceInput {
  itemId: string; // mapped to assetId
  maintenanceDate: Date | string;
  type: string;
  description: string;
  cost?: number;
  vendor?: string;
  performedBy?: string;
  nextSchedule?: Date | string;
  notes?: string;
}

export interface UpdateAssetMaintenanceInput extends Partial<CreateAssetMaintenanceInput> {}

export interface CreateAssetAssignmentInput {
  assetId: string;
  userId: string;
  assignedAt: Date | string;
  dueDate?: Date | string;
  conditionBefore: AssetCondition;
  notes?: string;
}

export interface ReturnAssetInput {
  returnedAt: Date | string;
  conditionAfter: AssetCondition;
  notes?: string;
}

export interface CreateAssetAuditInput {
  unitId: string;
  date: Date | string;
  notes?: string;
}

export interface UpdateAssetAuditItemInput {
  actualStatus: string;
  condition: AssetCondition;
  notes?: string;
  isMatch: boolean;
}

export interface InventoryStats {
  totalItems: number;
  byStatus: { status: AssetStatus; count: number }[];
  byCondition: { condition: AssetCondition; count: number }[];
  byCategory: { categoryId: string; categoryName: string; count: number }[];
  recentMaintenances: number;
  totalValue: number;
}

export interface AssetDepreciation {
  cost: number;
  residual: number;
  lifeMonths: number;
  ageMonths: number;
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  bookValue: number;
}
