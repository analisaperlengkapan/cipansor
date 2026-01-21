import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { ApiResponse } from "@/lib/api";

// ==================== TYPES ====================

export interface Province {
  id: string;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    regencies: number;
  };
}

export interface Regency {
  id: string;
  code: string;
  name: string;
  provinceId: string;
  province?: Province;
  createdAt: string;
  updatedAt: string;
  _count?: {
    districts: number;
  };
}

export interface District {
  id: string;
  code: string;
  name: string;
  regencyId: string;
  regency?: Regency;
  createdAt: string;
  updatedAt: string;
  _count?: {
    villages: number;
  };
}

export interface Village {
  id: string;
  code: string;
  name: string;
  districtId: string;
  district?: District;
  postalCode?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== PROVINCES ====================

interface UseProvincesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function useProvinces(params?: UseProvincesParams) {
  return useQuery({
    queryKey: ["provinces", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Province[]>>(
        "/wilayah/provinces",
        { params },
      );
      return response.data.data;
    },
  });
}

export function useProvince(id: string) {
  return useQuery({
    queryKey: ["provinces", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Province>>(
        `/wilayah/provinces/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateProvinceData {
  code: string;
  name: string;
}

export function useCreateProvince() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProvinceData) => {
      const response = await api.post<ApiResponse<Province>>(
        "/wilayah/provinces",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provinces"] });
    },
  });
}

// ==================== REGENCIES ====================

interface UseRegenciesParams {
  page?: number;
  limit?: number;
  search?: string;
  provinceId?: string;
}

export function useRegencies(params?: UseRegenciesParams) {
  return useQuery({
    queryKey: ["regencies", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Regency[]>>(
        "/wilayah/regencies",
        { params },
      );
      return response.data.data;
    },
  });
}

export function useRegency(id: string) {
  return useQuery({
    queryKey: ["regencies", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Regency>>(
        `/wilayah/regencies/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateRegencyData {
  code: string;
  name: string;
  provinceId: string;
}

export function useCreateRegency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRegencyData) => {
      const response = await api.post<ApiResponse<Regency>>(
        "/wilayah/regencies",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regencies"] });
    },
  });
}

// ==================== DISTRICTS ====================

interface UseDistrictsParams {
  page?: number;
  limit?: number;
  search?: string;
  regencyId?: string;
}

export function useDistricts(params?: UseDistrictsParams) {
  return useQuery({
    queryKey: ["districts", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<District[]>>(
        "/wilayah/districts",
        { params },
      );
      return response.data.data;
    },
    enabled: params?.regencyId !== undefined || params?.regencyId === undefined,
  });
}

export function useDistrict(id: string) {
  return useQuery({
    queryKey: ["districts", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<District>>(
        `/wilayah/districts/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateDistrictData {
  code: string;
  name: string;
  regencyId: string;
}

export function useCreateDistrict() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDistrictData) => {
      const response = await api.post<ApiResponse<District>>(
        "/wilayah/districts",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["districts"] });
    },
  });
}

// ==================== VILLAGES ====================

interface UseVillagesParams {
  page?: number;
  limit?: number;
  search?: string;
  districtId?: string;
}

export function useVillages(params?: UseVillagesParams) {
  return useQuery({
    queryKey: ["villages", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Village[]>>(
        "/wilayah/villages",
        { params },
      );
      return response.data.data;
    },
    enabled:
      params?.districtId !== undefined || params?.districtId === undefined,
  });
}

export function useVillage(id: string) {
  return useQuery({
    queryKey: ["villages", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Village>>(
        `/wilayah/villages/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateVillageData {
  code: string;
  name: string;
  districtId: string;
  postalCode?: string;
}

export function useCreateVillage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVillageData) => {
      const response = await api.post<ApiResponse<Village>>(
        "/wilayah/villages",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["villages"] });
    },
  });
}

// ==================== CASCADING SELECTORS ====================

/**
 * Hook for wilayah selection with all levels
 * Use individual hooks (useRegencies, useDistricts, useVillages) with proper params
 * instead of this helper for cascading selection
 *
 * @example
 * ```tsx
 * const [provinceId, setProvinceId] = useState<string>('');
 * const [regencyId, setRegencyId] = useState<string>('');
 * const [districtId, setDistrictId] = useState<string>('');
 *
 * const { data: provinces } = useProvinces();
 * const { data: regencies } = useRegencies({ provinceId: provinceId || undefined });
 * const { data: districts } = useDistricts({ regencyId: regencyId || undefined });
 * const { data: villages } = useVillages({ districtId: districtId || undefined });
 * ```
 */
export function useWilayahCascadeState(initialValues?: {
  provinceId?: string;
  regencyId?: string;
  districtId?: string;
  villageId?: string;
}) {
  const provinces = useProvinces();

  return {
    provinces,
    // Consumers should use useRegencies/useDistricts/useVillages directly with their selected IDs
    initialProvinceId: initialValues?.provinceId,
    initialRegencyId: initialValues?.regencyId,
    initialDistrictId: initialValues?.districtId,
    initialVillageId: initialValues?.villageId,
  };
}
