import { useQuery } from '@tanstack/react-query';
import api, { ApiResponse, User } from '@/lib/api';

export function useTeachers(unitId?: string) {
  return useQuery({
    queryKey: ['teachers', unitId],
    queryFn: async () => {
      const params = { role: 'TEACHER', ...(unitId && { unitId }) };
      const response = await api.get<ApiResponse<User[]>>('/users', { params });
      return response.data.data;
    },
  });
}
