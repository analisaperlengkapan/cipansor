import { useAuthStore } from '@/stores/auth';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, fetchUser, switchRole } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    fetchUser,
    switchRole
  };
};
