/**
 * API Client
 * Re-export of main api instance for backward compatibility
 * 
 * Note: This file ensures backward compatibility with hooks that import from '@/lib/api-client'
 * All new code should import directly from '@/lib/api'
 */

import api from './api';

// Export as apiClient for backward compatibility
export const apiClient = api;

// Re-export everything from api
export * from './api';
export default api;
