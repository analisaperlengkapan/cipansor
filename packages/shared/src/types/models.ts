import { UserRole, UnitType, Gender } from './enums';

// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// User
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  unitId?: string | null;
}

// Unit
export interface Unit extends BaseEntity {
  name: string;
  type: UnitType;
  address: string;
  phone?: string | null;
  email?: string | null;
}

// Student
export interface Student extends BaseEntity {
  userId: string;
  unitId: string;
  nis: string;
  nisn?: string | null;
  gender: Gender;
  birthPlace: string;
  birthDate: Date;
  address: string;
  parentName: string;
  parentPhone: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: Pagination;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'deletedAt'>;
  token: string;
  refreshToken?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  unitId?: string | null;
  iat: number;
  exp: number;
}
