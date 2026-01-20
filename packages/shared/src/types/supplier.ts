export interface Supplier {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  contactPerson?: string | null;
  category?: string | null;
  rating?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateSupplierInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
  category?: string;
  rating?: number;
  bankName?: string;
  bankAccount?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  isActive?: boolean;
}
