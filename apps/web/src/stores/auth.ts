import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, authApi, rolesApi, LoginRequest } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  switchRole: (roleAssignmentId: string) => Promise<void>;
  clearError: () => void;
}

// Custom storage that syncs with cookies for middleware
const customStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    const item = localStorage.getItem(name);
    // Also sync to cookie for middleware
    if (item) {
      document.cookie = `${name}=${encodeURIComponent(item)}; path=/; max-age=86400; samesite=lax`;
    }
    return item;
  },
  setItem: (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
    // Also sync to cookie for middleware
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=86400; samesite=lax`;
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
    // Also remove from cookie
    document.cookie = `${name}=; path=/; max-age=0`;
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          const { user, accessToken, refreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          // Also set token in cookie for middleware
          document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; samesite=lax`;
          
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Login failed';
          const axiosError = error as { response?: { data?: { message?: string } } };
          set({ 
            error: axiosError.response?.data?.message || message, 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Also remove from cookies
          document.cookie = 'accessToken=; path=/; max-age=0';
          document.cookie = 'auth-storage=; path=/; max-age=0';
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        set({ isLoading: true });
        try {
          const response = await authApi.me();
          set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          // Also remove from cookies
          document.cookie = 'accessToken=; path=/; max-age=0';
          document.cookie = 'auth-storage=; path=/; max-age=0';
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      switchRole: async (roleAssignmentId: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await rolesApi.switchRole(roleAssignmentId);
          const { accessToken, refreshToken } = response.data.data;
          
          // Update tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; samesite=lax`;
          
          // Fetch updated user data
          const userResponse = await authApi.me();
          set({ user: userResponse.data.data, isLoading: false });
          
          // Reload page to refresh navigation and permissions
          window.location.reload();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to switch role';
          const axiosError = error as { response?: { data?: { message?: string } } };
          set({ 
            error: axiosError.response?.data?.message || message, 
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
