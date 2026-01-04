import { Unit } from './models';
// Removed AcademicYear import as it does not exist in models.ts
// We will define a local partial interface for it or just use it as a reference

// Enums (Specific to Finance, ideally these should be in enums.ts if they are shared widely,
// but sticking to module file if specific)
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE'
}

export enum JournalReferenceType {
  MANUAL = 'MANUAL',
  INVOICE = 'INVOICE',
  PAYMENT = 'PAYMENT',
  SCHOLARSHIP = 'SCHOLARSHIP',
  PAYROLL = 'PAYROLL',
  OTHER = 'OTHER'
}

export enum ScholarshipType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  SPECIFIC = 'SPECIFIC'
}

export enum ScholarshipSource {
  INTERNAL = 'INTERNAL',
  GOVERNMENT = 'GOVERNMENT',
  FOUNDATION = 'FOUNDATION',
  DONOR = 'DONOR',
  COMPANY = 'COMPANY',
  OTHER = 'OTHER'
}

export enum ScholarshipStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED'
}

export enum PaymentCategory {
  SPP = 'SPP',
  REGISTRATION = 'REGISTRATION',
  BUILDING = 'BUILDING',
  UNIFORM = 'UNIFORM',
  BOOK = 'BOOK',
  ACTIVITY = 'ACTIVITY',
  EXAM = 'EXAM',
  OTHER = 'OTHER'
}

// Interfaces

export interface AccountCode {
  id: string;
  code: string;
  name: string;
  type: AccountType | string; // Use string fallback if enum mismatch
  parentId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  parent?: AccountCode;
  children?: AccountCode[];
}

export interface JournalEntry {
  id: string;
  unitId: string;
  accountId: string;
  date: Date | string; // Allow string for JSON response
  description?: string | null;
  debit: number; // Transported as number usually, but careful with precision
  credit: number;
  reference?: string | null;
  referenceType?: JournalReferenceType | string | null;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;

  unit?: Unit;
  account?: AccountCode;
  createdBy?: { id: string; name: string };
}

export interface Scholarship {
  id: string;
  name: string;
  description?: string | null;
  source: ScholarshipSource | string;
  type: ScholarshipType | string;
  quota?: number | null;
  requirements?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  unitId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  unit?: Unit;
  _count?: {
    recipients: number;
    discounts: number;
  };
}

export interface ScholarshipRecipient {
  id: string;
  scholarshipId: string;
  studentId: string;
  academicYearId: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  notes?: string | null;
  status: ScholarshipStatus | string;
  createdAt?: Date;
  updatedAt?: Date;

  scholarship?: Scholarship;
  student?: any; // Avoiding circular dependency or complex Student type for now, or use a partial
  academicYear?: { id: string; name: string }; // Minimal interface
}

export interface PaymentComponent {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category: PaymentCategory | string;
  amount: number;
  unitId: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  unit?: Unit;
}

// DTOs

export interface CreateAccountCodeInput {
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  isActive?: boolean;
}

// Fixed: Partial expects a Type, not an interface directly in extends clause if using utility types in a way that confused TS,
// but usually interface I extends Partial<Other> is valid.
// The error was "An interface can only extend an identifier/qualified-name with optional type arguments."
// This happens when you try to extend `Partial<Type>`. Interfaces can only extend other interfaces/classes.
// You should use `type` for this or duplicate props.
export type UpdateAccountCodeInput = Partial<CreateAccountCodeInput>;

export interface CreateJournalEntryInput {
  unitId: string;
  accountId: string;
  date: Date | string;
  description?: string;
  debit?: number;
  credit?: number;
  reference?: string;
  referenceType?: JournalReferenceType;
}

export interface CreateScholarshipInput {
  name: string;
  description?: string;
  source: ScholarshipSource;
  type: ScholarshipType;
  quota?: number;
  requirements?: string;
  startDate: Date | string;
  endDate?: Date | string;
  unitId: string;
  isActive?: boolean;
}

export interface AssignScholarshipInput {
  scholarshipId: string;
  studentId: string;
  academicYearId: string;
  startDate: Date | string;
  endDate?: Date | string;
  notes?: string;
}

export interface CreatePaymentComponentInput {
  code: string;
  name: string;
  description?: string;
  category: PaymentCategory;
  amount: number;
  unitId: string;
  isActive?: boolean;
}

// Report Types

export interface TrialBalanceItem {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export interface TrialBalanceReport {
  period: { startDate: string; endDate: string };
  accounts: TrialBalanceItem[];
  totals: { debit: number; credit: number };
  isBalanced: boolean;
}

export interface IncomeExpenseItem {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface IncomeExpenseReport {
  period: { startDate: string; endDate: string };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
  };
  breakdown: IncomeExpenseItem[];
}
