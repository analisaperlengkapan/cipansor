import { Response } from 'express';

/**
 * Standard API Response helper
 */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseData<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: Pagination;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export const ApiResponse = {
  /**
   * Success response
   */
  success<T>(data: T, message?: string, pagination?: Pagination): ApiResponseData<T> {
    return {
      success: true,
      data,
      ...(message && { message }),
      ...(pagination && { pagination }),
    };
  },

  /**
   * Error response
   */
  error(
    message: string,
    code: string = 'ERROR',
    details?: Array<{ field: string; message: string }>
  ): ApiResponseData {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };
  },

  /**
   * Paginated response
   */
  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): ApiResponseData<T[]> {
    return {
      success: true,
      data,
      ...(message && { message }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

export const sendResponse = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
};

export default ApiResponse;
