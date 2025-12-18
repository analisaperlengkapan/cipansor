import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized (Token Refresh)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    // Global Error Handling (except for 401 which is handled above)
    if (error.response?.status !== 401) {
      const data = error.response?.data as any;
      const message = data?.error?.message || data?.message || error.message || 'Terjadi kesalahan sistem';
      const code = data?.error?.code;

      toast.error(message, {
        description: code ? `Error Code: ${code}` : undefined,
      });
    }

    return Promise.reject(error);
  }
);

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

// Auth Types
export interface UserRole {
  id: string;
  isPrimary: boolean;
  role: {
    id: string;
    code: string;
    name: string;
    realm: string;
    description?: string;
  };
  unit?: {
    id: string;
    name: string;
  } | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'UNIT_ADMIN' | 'TEACHER' | 'STUDENT' | 'STAFF' | 'PARENT';
  unitId?: string;
  unit?: {
    id: string;
    name: string;
    type: string;
  };
  userRoles?: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get<ApiResponse<User>>('/auth/me'),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// Roles API
export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  realm: string;
  permissions?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  unitId?: string;
  isPrimary: boolean;
  isActive: boolean;
  assignedAt: string;
  expiresAt?: string;
  role: Role;
  unit?: {
    id: string;
    name: string;
    type: string;
  };
  user?: User;
}

export interface SwitchRoleResponse {
  message: string;
  activeRole: UserRole;
  accessToken: string;
  refreshToken: string;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  unitId?: string;
  isPrimary?: boolean;
}

export const rolesApi = {
  // Get current user's roles
  getMyRoles: () =>
    api.get<ApiResponse<UserRole[]>>('/roles/my-roles'),

  // Switch active role
  switchRole: (roleAssignmentId: string) =>
    api.post<ApiResponse<SwitchRoleResponse>>('/roles/switch', { roleAssignmentId }),

  // Get all roles (optionally filtered by realm)
  getAllRoles: (realm?: string) =>
    api.get<ApiResponse<Role[]>>(
      '/roles',
      { params: realm ? { realm } : undefined }
    ),

  // Get role by ID
  getRoleById: (id: string) =>
    api.get<ApiResponse<Role>>(`/roles/${id}`),

  // Get roles assigned to a user
  getUserRoles: (userId: string) =>
    api.get<ApiResponse<RoleAssignment[]>>(`/roles/users/${userId}`),

  // Assign role to user
  assignRole: (data: AssignRoleRequest) =>
    api.post<ApiResponse<RoleAssignment>>('/roles/assign', data),

  // Set primary role for user
  setPrimaryRole: (userId: string, roleAssignmentId: string) =>
    api.patch<ApiResponse<RoleAssignment>>(`/roles/users/${userId}/primary`, { roleAssignmentId }),

  // Remove role assignment
  removeRoleAssignment: (assignmentId: string) =>
    api.delete<ApiResponse<void>>(`/roles/assignments/${assignmentId}`),
};

export default api;
