/**
 * API Service Types
 * Shared types for all API services
 */

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: {
        code: string;
        message: string;
        details?: Array<{ field: string; message: string }>;
    };
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

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface DateRangeParams {
    startDate?: string;
    endDate?: string;
}

export interface UnitFilterParams {
    unitId?: string;
}

export interface PeriodParams {
    period?: 'week' | 'month' | 'year';
}

export interface SortParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
