import { useQuery } from "@tanstack/react-query";
import api, { ApiResponse } from "@/lib/api";

export interface Settings {
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  institutionEmail: string;
  institutionLogo?: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

// Default settings
const defaultSettings: Settings = {
  institutionName: "Yayasan Pendidikan Islam Al-Hidayah",
  institutionAddress: "Jl. Pendidikan No. 123, Kota",
  institutionPhone: "(021) 1234567",
  institutionEmail: "info@yayasan.sch.id",
  institutionLogo: undefined,
  currency: "IDR",
  timezone: "Asia/Jakarta",
  dateFormat: "dd/MM/yyyy",
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<Settings>>("/settings");
        return response.data.data;
      } catch {
        // Return default settings if API is not available
        return defaultSettings;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false,
  });
}
