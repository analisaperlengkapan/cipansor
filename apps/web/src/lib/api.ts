import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import {
  User,
  LoginRequest,
  LoginResponse,
  UserRoleAssignment,
  Role,
  RoleAssignment,
  SwitchRoleResponse,
  AssignRoleRequest,
  ApiResponse,
  PaginatedResponse as SharedPaginatedResponse,
  TahfidzRecord,
  TahfidzDashboardStats,
  TahfidzStudentSummary,
  CreateTahfidzInput,
  UpdateTahfidzInput,
} from "@cipansor/shared";

// Explicitly export SharedPaginatedResponse for new modules
export type { SharedPaginatedResponse };
// Re-export shared types
export * from "@cipansor/shared";

// Compatibility alias
export type UserRole = UserRoleAssignment;

// LEGACY PaginatedResponse
// Restoring this to prevent build errors in legacy modules.
// New modules should use `SharedPaginatedResponse`.
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized (Token Refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          window.location.href = "/login";
        }
      }
    }

    // Global Error Handling (except for 401 which is handled above)
    if (error.response?.status !== 401) {
      const data = error.response?.data as any;
      const message =
        data?.error?.message ||
        data?.message ||
        error.message ||
        "Terjadi kesalahan sistem";
      const code = data?.error?.code;

      toast.error(message, {
        description: code ? `Error Code: ${code}` : undefined,
      });
    }

    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  me: () => api.get<ApiResponse<User>>("/auth/me"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/password", data),
};

export const rolesApi = {
  // Get current user's roles
  getMyRoles: () =>
    api.get<ApiResponse<UserRoleAssignment[]>>("/roles/my-roles"),

  // Switch active role
  switchRole: (roleAssignmentId: string) =>
    api.post<ApiResponse<SwitchRoleResponse>>("/roles/switch", {
      roleAssignmentId,
    }),

  // Get all roles (optionally filtered by realm)
  getAllRoles: (realm?: string) =>
    api.get<ApiResponse<Role[]>>("/roles", {
      params: realm ? { realm } : undefined,
    }),

  // Get role by ID
  getRoleById: (id: string) => api.get<ApiResponse<Role>>(`/roles/${id}`),

  // Get roles assigned to a user
  getUserRoles: (userId: string) =>
    api.get<ApiResponse<RoleAssignment[]>>(`/roles/users/${userId}`),

  // Assign role to user
  assignRole: (data: AssignRoleRequest) =>
    api.post<ApiResponse<RoleAssignment>>("/roles/assign", data),

  // Set primary role for user
  setPrimaryRole: (userId: string, roleAssignmentId: string) =>
    api.patch<ApiResponse<RoleAssignment>>(`/roles/users/${userId}/primary`, {
      roleAssignmentId,
    }),

  // Remove role assignment
  removeRoleAssignment: (assignmentId: string) =>
    api.delete<ApiResponse<void>>(`/roles/assignments/${assignmentId}`),
};

// Tahfidz API
// Uses SharedPaginatedResponse to enforce standard structure
export const tahfidzApi = {
  getRecords: (params?: any) =>
    api.get<SharedPaginatedResponse<TahfidzRecord>>("/tahfidz", { params }),

  getRecordById: (id: string) =>
    api.get<ApiResponse<TahfidzRecord>>(`/tahfidz/${id}`),

  createRecord: (data: CreateTahfidzInput) =>
    api.post<ApiResponse<TahfidzRecord>>("/tahfidz", data),

  updateRecord: (id: string, data: UpdateTahfidzInput) =>
    api.put<ApiResponse<TahfidzRecord>>(`/tahfidz/${id}`, data),

  deleteRecord: (id: string) => api.delete<ApiResponse<void>>(`/tahfidz/${id}`),

  getDashboard: (params: { unitId?: string; year?: number; month?: number }) =>
    api.get<ApiResponse<TahfidzDashboardStats>>("/tahfidz/dashboard", {
      params,
    }),

  getStudentSummary: (studentId: string) =>
    api.get<ApiResponse<TahfidzStudentSummary>>(
      `/tahfidz/students/${studentId}/summary`,
    ),
};

// General Upload API
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<
      ApiResponse<{
        url: string;
        filename: string;
        mimetype: string;
        size: number;
      }>
    >("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export default api;
