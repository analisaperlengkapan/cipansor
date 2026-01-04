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
  maintenanceLogs?: AssetMaintenance[];
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

export interface InventoryStats {
  totalItems: number;
  byStatus: { status: AssetStatus; count: number }[];
  byCondition: { condition: AssetCondition; count: number }[];
  byCategory: { categoryId: string; categoryName: string; count: number }[];
  recentMaintenances: number;
  totalValue: number;
}
