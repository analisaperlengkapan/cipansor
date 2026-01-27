import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { ApiResponse } from "@/lib/api";
import { toast } from "sonner";

export interface InventorySettings {
  depreciationExpenseAccount: string | null;
  accumulatedDepreciationAccount: string | null;
}

export function useInventorySettings(unitId: string) {
  return useQuery({
    queryKey: ["inventory-settings", unitId],
    queryFn: async () => {
      if (!unitId) return null;
      const response = await api.get<ApiResponse<InventorySettings>>(
        `/inventory/settings?unitId=${unitId}`,
      );
      return response.data.data;
    },
    enabled: !!unitId,
  });
}

export function useUpdateInventorySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      unitId: string;
      depreciationExpenseAccount: string | null;
      accumulatedDepreciationAccount: string | null;
    }) => {
      const response = await api.put<ApiResponse<void>>(
        "/inventory/settings",
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["inventory-settings", variables.unitId],
      });
      toast.success("Pengaturan berhasil disimpan");
    },
    onError: () => {
      toast.error("Gagal menyimpan pengaturan");
    },
  });
}

export function useRunDepreciation() {
  return useMutation({
    mutationFn: async (unitId?: string) => {
      const response = await api.post<ApiResponse<any>>(
        "/inventory/depreciation/run",
        { unitId },
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      const successCount = data.reduce(
        (acc: number, res: any) => acc + (res.processed || 0),
        0,
      );
      if (successCount > 0) {
        toast.success(
          `Depresiasi berhasil dijalankan. ${successCount} jurnal dibuat.`,
        );
      } else {
        toast.info("Tidak ada jurnal depresiasi yang dibuat.");
      }
    },
    onError: (error: any) => {
      toast.error(
        `Gagal menjalankan depresiasi: ${error.response?.data?.message || error.message}`,
      );
    },
  });
}
