import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Types
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED';
export type EmployeeType = 'PERMANENT' | 'CONTRACT' | 'PART_TIME' | 'INTERN';
type Gender = 'MALE' | 'FEMALE';

export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'RESIGNED', 'RETIRED'];
export const EMPLOYEE_TYPES: EmployeeType[] = ['PERMANENT', 'CONTRACT', 'PART_TIME', 'INTERN'];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ACTIVE: 'Aktif',
  INACTIVE: 'Tidak Aktif',
  ON_LEAVE: 'Cuti',
  RESIGNED: 'Resign',
  RETIRED: 'Pensiun',
};

export const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  PERMANENT: 'Tetap',
  CONTRACT: 'Kontrak',
  PART_TIME: 'Part Time',
  INTERN: 'Magang',
};

export interface Employee {
  id: string;
  nip: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  departmentId?: string;
  department?: {
    id: string;
    name: string;
  };
  
  // Personal info
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string;
  nationalId?: string;
  nik?: string;
  taxId?: string;
  npwp?: string;
  maritalStatus: string;
  religion: string;
  
  // Contact
  phone: string;
  email?: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  
  // Employment
  position: string;
  employeeType: EmployeeType;
  status: EmployeeStatus;
  joinDate: string;
  endDate?: string;
  resignDate?: string;
  
  // Education
  lastEducation?: string;
  educationMajor?: string;
  educationInstitution?: string;
  graduationYear?: number;
  
  // Bank info
  bankName?: string;
  bankAccount?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  
  // Insurance
  bpjsKesehatan?: string;
  bpjsKetenagakerjaan?: string;
  
  // Leave
  leaveBalance?: number;
  
  // Documents
  photoUrl?: string;
  cvUrl?: string;
  contractUrl?: string;
  documents?: {
    name: string;
    url: string;
    type?: string;
    uploadedAt?: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headId?: string;
  head?: Employee;
  parentId?: string;
  parent?: Department;
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    employees?: number;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: Employee;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name?: string;
    fullName: string;
  };
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'MARRIAGE' | 'BEREAVEMENT' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export const LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'MARRIAGE', 'BEREAVEMENT', 'UNPAID', 'OTHER'];
export const LEAVE_STATUSES: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  ANNUAL: 'Cuti Tahunan',
  SICK: 'Sakit',
  MATERNITY: 'Melahirkan',
  PATERNITY: 'Kelahiran Anak',
  MARRIAGE: 'Menikah',
  BEREAVEMENT: 'Duka Cita',
  UNPAID: 'Tanpa Gaji',
  OTHER: 'Lainnya',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Menunggu',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export interface Payroll {
  id: string;
  employeeId: string;
  employee?: Employee;
  month: number;
  year: number;
  
  // Earnings
  basicSalary: number;
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  totalAllowances: number;
  overtime: number;
  bonus: number;
  
  // Deductions
  deductions?: { name: string; amount: number }[];
  taxDeduction: number;
  bpjsHealth: number;
  bpjsEmployment: number;
  otherDeductions: number;
  
  // Net
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  
  status: PayrollStatus;
  paidAt?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type PayrollStatus = 'DRAFT' | 'PENDING' | 'PROCESSED' | 'PAID' | 'CANCELLED';

export const PAYROLL_STATUSES: PayrollStatus[] = ['DRAFT', 'PENDING', 'PROCESSED', 'PAID', 'CANCELLED'];

export const PAYROLL_STATUS_LABELS: Record<PayrollStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu',
  PROCESSED: 'Diproses',
  PAID: 'Dibayar',
  CANCELLED: 'Dibatalkan',
};

// Employee queries
export function useEmployees(params?: {
  unitId?: string;
  departmentId?: string;
  status?: EmployeeStatus;
  type?: EmployeeType;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const response = await api.get('/hr/employees', { params });
      return response.data as {
        data: Employee[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await api.get(`/hr/employees/${id}`);
      return response.data.data as Employee;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/hr/employees', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData | Partial<Employee> }) => {
      const isFormData = data instanceof FormData;
      const response = await api.put(`/hr/employees/${id}`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

// Department queries
export function useDepartments(params?: { unitId?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['departments', params],
    queryFn: async () => {
      const response = await api.get('/hr/departments', { params });
      return response.data.data as Department[];
    },
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ['department', id],
    queryFn: async () => {
      const response = await api.get(`/hr/departments/${id}`);
      return response.data.data as Department;
    },
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Department>) => {
      const response = await api.post('/hr/departments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
      const response = await api.put(`/hr/departments/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hr/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

// Leave request queries
export function useLeaveRequests(params?: {
  employeeId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['leave-requests', params],
    queryFn: async () => {
      const response = await api.get('/hr/leave-requests', { params });
      return response.data as {
        data: LeaveRequest[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function useLeaveRequest(id: string) {
  return useQuery({
    queryKey: ['leave-request', id],
    queryFn: async () => {
      const response = await api.get(`/hr/leave-requests/${id}`);
      return response.data.data as LeaveRequest;
    },
    enabled: !!id,
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData | Partial<LeaveRequest>) => {
      const isFormData = data instanceof FormData;
      const response = await api.post('/hr/leave-requests', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/hr/leave-requests/${id}/approve`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/hr/leave-requests/${id}/reject`, { reason });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/hr/leave-requests/${id}/cancel`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}

// Payroll queries
export function usePayrolls(params?: {
  employeeId?: string;
  unitId?: string;
  month?: number;
  year?: number;
  status?: PayrollStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['payrolls', params],
    queryFn: async () => {
      const response = await api.get('/hr/payrolls', { params });
      return response.data as {
        data: Payroll[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      };
    },
  });
}

export function usePayroll(id: string) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: async () => {
      const response = await api.get(`/hr/payrolls/${id}`);
      return response.data.data as Payroll;
    },
    enabled: !!id,
  });
}

export function useGeneratePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const response = await api.post('/hr/payrolls/generate', { month, year });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
    },
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Payroll> }) => {
      const response = await api.put(`/hr/payrolls/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
    },
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/hr/payrolls/${id}/approve`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
    },
  });
}

export function usePayPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const response = await api.post('/hr/payrolls/pay', { ids: idArray });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}

export function useProcessPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const response = await api.post('/hr/payrolls/process', { ids: idArray });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}

export function useCancelPayroll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string | string[]) => {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const response = await api.post('/hr/payrolls/cancel', { ids: idArray });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });
}

export function usePayrollSummary(params?: { month?: number; year?: number; unitId?: string }) {
  return useQuery({
    queryKey: ['payroll-summary', params],
    queryFn: async () => {
      const response = await api.get('/hr/payrolls/summary', { params });
      return response.data.data as {
        totalEmployees: number;
        employeeCount: number;
        totalGross: number;
        totalGrossSalary: number;
        totalDeductions: number;
        totalNetSalary: number;
        totalNet: number;
        byStatus: { status: PayrollStatus; count: number; total: number }[];
        byDepartment: { departmentId: string; departmentName: string; count: number; total: number }[];
      };
    },
  });
}
