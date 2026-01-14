import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { QuranProgressMap } from '@cipansor/shared';

export function useQuranMap(studentId: string | null) {
  return useQuery({
    queryKey: ['quran-map', studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const response = await api.get(`/tahfidz/map/${studentId}`);
      return response.data.data as QuranProgressMap;
    },
    enabled: !!studentId,
  });
}
