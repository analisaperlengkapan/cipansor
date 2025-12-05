"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ==================== TYPES ====================

export type AccountCodeType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface AccountCode {
  id: string;
  code: string;
  name: string;
  type: AccountCodeType;
  parentId?: string | null;
  isActive: boolean;
  parent?: { id: string; code: string; name: string } | null;
  children?: { id: string; code: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  unitId?: string;
  accountId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  referenceType?: string;
  unit?: { id: string; name: string };
  account?: { id: string; code: string; name: string; type: AccountCodeType };
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export type ScholarshipSource = "INTERNAL" | "GOVERNMENT" | "COMPANY" | "FOUNDATION" | "OTHER";
export type ScholarshipType = "FULL" | "PARTIAL" | "SPECIFIC";
export type ScholarshipRecipientStatus = "ACTIVE" | "SUSPENDED" | "ENDED";

export interface Scholarship {
  id: string;
  name: string;
  description?: string;
  source: ScholarshipSource;
  type: ScholarshipType;
  quota?: number;
  requirements?: string;
  startDate: string;
  endDate?: string;
  unitId?: string;
  isActive: boolean;
  unit?: { id: string; name: string };
  _count?: { recipients: number; discounts: number };
  createdAt: string;
  updatedAt: string;
}

export interface ScholarshipRecipient {
  id: string;
  scholarshipId: string;
  studentId: string;
  academicYearId: string;
  status: ScholarshipRecipientStatus;
  startDate: string;
  endDate?: string;
  notes?: string;
  scholarship?: { name: string };
  student?: {
    id: string;
    nis: string;
    name: string;
    class?: string;
  };
  academicYear?: { name: string };
  createdAt: string;
}

export type PaymentComponentCategory = 
  | "SPP"
  | "REGISTRATION"
  | "UNIFORM"
  | "BOOKS"
  | "ACTIVITY"
  | "EXAM"
  | "BUILDING"
  | "OTHER";

export interface PaymentComponent {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: PaymentComponentCategory;
  amount: number;
  unitId?: string;
  isActive: boolean;
  unit?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface TrialBalanceReport {
  period: { startDate: string; endDate: string };
  accounts: {
    code: string;
    name: string;
    type: string;
    debit: number;
    credit: number;
  }[];
  totals: { debit: number; credit: number };
  isBalanced: boolean;
}

export interface IncomeExpenseReport {
  period: { startDate: string; endDate: string };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
  };
  breakdown: {
    period: string;
    income: number;
    expense: number;
    net: number;
  }[];
}

// ==================== ACCOUNT CODES ====================

interface AccountCodeFilters {
  type?: AccountCodeType;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function useAccountCodes(filters: AccountCodeFilters = {}) {
  return useQuery({
    queryKey: ["account-codes", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.isActive !== undefined) params.append("isActive", String(filters.isActive));
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const response = await api.get(`/finance-enhancement/account-codes?${params}`);
      return response.data as {
        data: AccountCode[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });
}

export function useCreateAccountCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      type: AccountCodeType;
      parentId?: string;
      isActive?: boolean;
    }) => {
      const response = await api.post("/finance-enhancement/account-codes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-codes"] });
    },
  });
}

export function useUpdateAccountCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      type?: AccountCodeType;
      parentId?: string | null;
      isActive?: boolean;
    }) => {
      const response = await api.put(`/finance-enhancement/account-codes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-codes"] });
    },
  });
}

// ==================== JOURNAL ENTRIES ====================

interface JournalEntryFilters {
  unitId?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useJournalEntries(filters: JournalEntryFilters = {}) {
  return useQuery({
    queryKey: ["journal-entries", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.unitId) params.append("unitId", filters.unitId);
      if (filters.accountId) params.append("accountId", filters.accountId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const response = await api.get(`/finance-enhancement/journal-entries?${params}`);
      return response.data as {
        data: JournalEntry[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: ["journal-entry", id],
    queryFn: async () => {
      const response = await api.get(`/finance-enhancement/journal-entries/${id}`);
      return response.data.data as JournalEntry;
    },
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      unitId?: string;
      accountId: string;
      date: string;
      description: string;
      debit?: number;
      credit?: number;
      reference?: string;
      referenceType?: string;
    }) => {
      const response = await api.post("/finance-enhancement/journal-entries", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

// ==================== SCHOLARSHIPS ====================

interface ScholarshipFilters {
  unitId?: string;
  type?: ScholarshipType;
  source?: ScholarshipSource;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export function useScholarships(filters: ScholarshipFilters = {}) {
  return useQuery({
    queryKey: ["scholarships", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.unitId) params.append("unitId", filters.unitId);
      if (filters.type) params.append("type", filters.type);
      if (filters.source) params.append("source", filters.source);
      if (filters.isActive !== undefined) params.append("isActive", String(filters.isActive));
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const response = await api.get(`/finance-enhancement/scholarships?${params}`);
      return response.data as {
        data: Scholarship[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });
}

export function useScholarship(id: string) {
  return useQuery({
    queryKey: ["scholarship", id],
    queryFn: async () => {
      const response = await api.get(`/finance-enhancement/scholarships/${id}`);
      return response.data.data as Scholarship;
    },
    enabled: !!id,
  });
}

export function useScholarshipRecipients(scholarshipId: string, filters: { status?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ["scholarship-recipients", scholarshipId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const response = await api.get(`/finance-enhancement/scholarships/${scholarshipId}/recipients?${params}`);
      return response.data as {
        data: ScholarshipRecipient[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
    enabled: !!scholarshipId,
  });
}

export function useCreateScholarship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      source: ScholarshipSource;
      type: ScholarshipType;
      quota?: number;
      requirements?: string;
      startDate: string;
      endDate?: string;
      unitId?: string;
      isActive?: boolean;
    }) => {
      const response = await api.post("/finance-enhancement/scholarships", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarships"] });
    },
  });
}

export function useAssignScholarship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      scholarshipId: string;
      studentId: string;
      academicYearId: string;
      startDate: string;
      endDate?: string;
      notes?: string;
    }) => {
      const response = await api.post("/finance-enhancement/scholarship-recipients", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-recipients"] });
    },
  });
}

// ==================== PAYMENT COMPONENTS ====================

interface PaymentComponentFilters {
  unitId?: string;
  category?: PaymentComponentCategory;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export function usePaymentComponents(filters: PaymentComponentFilters = {}) {
  return useQuery({
    queryKey: ["payment-components", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.unitId) params.append("unitId", filters.unitId);
      if (filters.category) params.append("category", filters.category);
      if (filters.isActive !== undefined) params.append("isActive", String(filters.isActive));
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));

      const response = await api.get(`/finance-enhancement/payment-components?${params}`);
      return response.data as {
        data: PaymentComponent[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      };
    },
  });
}

export function useCreatePaymentComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      code: string;
      name: string;
      description?: string;
      category: PaymentComponentCategory;
      amount: number;
      unitId?: string;
      isActive?: boolean;
    }) => {
      const response = await api.post("/finance-enhancement/payment-components", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-components"] });
    },
  });
}

// ==================== REPORTS ====================

export function useTrialBalanceReport(filters: { unitId?: string; startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ["trial-balance-report", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.unitId) params.append("unitId", filters.unitId);
      params.append("startDate", filters.startDate);
      params.append("endDate", filters.endDate);

      const response = await api.get(`/finance-enhancement/reports/trial-balance?${params}`);
      return response.data.data as TrialBalanceReport;
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

export function useIncomeExpenseReport(filters: { 
  unitId?: string; 
  startDate: string; 
  endDate: string; 
  groupBy?: "month" | "day" 
}) {
  return useQuery({
    queryKey: ["income-expense-report", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.unitId) params.append("unitId", filters.unitId);
      params.append("startDate", filters.startDate);
      params.append("endDate", filters.endDate);
      if (filters.groupBy) params.append("groupBy", filters.groupBy);

      const response = await api.get(`/finance-enhancement/reports/income-expense?${params}`);
      return response.data.data as IncomeExpenseReport;
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}
