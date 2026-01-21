import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { ApiResponse } from "@/lib/api";

// ==================== TYPES ====================

export const LAND_OWNERSHIP_TYPES = [
  { value: "MILIK_SENDIRI", label: "Milik Sendiri" },
  { value: "SEWA", label: "Sewa" },
  { value: "PINJAM_PAKAI", label: "Pinjam Pakai" },
  { value: "WAKAF", label: "Wakaf" },
  { value: "HIBAH", label: "Hibah" },
  { value: "LAINNYA", label: "Lainnya" },
] as const;

export const BUILDING_CONDITION_TYPES = [
  { value: "BAIK", label: "Baik" },
  { value: "RUSAK_RINGAN", label: "Rusak Ringan" },
  { value: "RUSAK_SEDANG", label: "Rusak Sedang" },
  { value: "RUSAK_BERAT", label: "Rusak Berat" },
] as const;

export type LandOwnership = (typeof LAND_OWNERSHIP_TYPES)[number]["value"];
export type BuildingCondition =
  (typeof BUILDING_CONDITION_TYPES)[number]["value"];

export interface Land {
  id: string;
  name: string;
  address?: string;
  area: number;
  ownership: LandOwnership;
  certificateNo?: string;
  certificateDate?: string;
  nop?: string;
  unitId: string;
  unit?: { id: string; name: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    buildings: number;
  };
}

export interface Building {
  id: string;
  name: string;
  code?: string;
  landId: string;
  land?: Land;
  unitId: string;
  unit?: { id: string; name: string };
  floors: number;
  yearBuilt?: number;
  length?: number;
  width?: number;
  area?: number;
  condition: BuildingCondition;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rooms: number;
  };
}

export interface RoomType {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rooms: number;
  };
}

export interface FacilityRoom {
  id: string;
  name: string;
  code?: string;
  buildingId: string;
  building?: Building;
  roomTypeId: string;
  roomType?: RoomType;
  floor: number;
  capacity?: number;
  length?: number;
  width?: number;
  area?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacilitySummary {
  totalLands: number;
  totalLandArea: number;
  totalBuildings: number;
  totalBuildingArea: number;
  totalRooms: number;
  totalRoomCapacity: number;
  buildingsByCondition: Record<BuildingCondition, number>;
  landsByOwnership: Record<LandOwnership, number>;
}

// ==================== LANDS ====================

interface UseLandsParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
}

export function useLands(params?: UseLandsParams) {
  return useQuery({
    queryKey: ["lands", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Land[]>>("/facilities/lands", {
        params,
      });
      return response.data.data;
    },
  });
}

export function useLand(id: string) {
  return useQuery({
    queryKey: ["lands", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Land>>(
        `/facilities/lands/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateLandData {
  name: string;
  address?: string;
  area: number;
  ownership: LandOwnership;
  certificateNo?: string;
  certificateDate?: string;
  nop?: string;
  unitId: string;
  notes?: string;
}

export function useCreateLand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLandData) => {
      const response = await api.post<ApiResponse<Land>>(
        "/facilities/lands",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lands"] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

export function useUpdateLand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateLandData>;
    }) => {
      const response = await api.put<ApiResponse<Land>>(
        `/facilities/lands/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lands"] });
      queryClient.invalidateQueries({ queryKey: ["lands", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

export function useDeleteLand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/facilities/lands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lands"] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

// ==================== BUILDINGS ====================

interface UseBuildingsParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  landId?: string;
  condition?: BuildingCondition;
}

export function useBuildings(params?: UseBuildingsParams) {
  return useQuery({
    queryKey: ["buildings", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Building[]>>(
        "/facilities/buildings",
        { params },
      );
      return response.data.data;
    },
  });
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: ["buildings", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Building>>(
        `/facilities/buildings/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateBuildingData {
  name: string;
  code?: string;
  landId: string;
  unitId: string;
  floors: number;
  yearBuilt?: number;
  length?: number;
  width?: number;
  condition: BuildingCondition;
  notes?: string;
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBuildingData) => {
      const response = await api.post<ApiResponse<Building>>(
        "/facilities/buildings",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateBuildingData>;
    }) => {
      const response = await api.put<ApiResponse<Building>>(
        `/facilities/buildings/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["buildings", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/facilities/buildings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

// ==================== ROOM TYPES ====================

export function useRoomTypes() {
  return useQuery({
    queryKey: ["room-types"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RoomType[]>>(
        "/facilities/room-types",
      );
      return response.data.data;
    },
  });
}

export interface CreateRoomTypeData {
  name: string;
  code: string;
  description?: string;
}

export function useCreateRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomTypeData) => {
      const response = await api.post<ApiResponse<RoomType>>(
        "/facilities/room-types",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
    },
  });
}

export function useUpdateRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateRoomTypeData>;
    }) => {
      const response = await api.put<ApiResponse<RoomType>>(
        `/facilities/room-types/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
    },
  });
}

export function useDeleteRoomType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/facilities/room-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
    },
  });
}

// ==================== FACILITY ROOMS ====================

interface UseRoomsParams {
  page?: number;
  limit?: number;
  search?: string;
  buildingId?: string;
  roomTypeId?: string;
  isActive?: boolean;
}

export function useRooms(params?: UseRoomsParams) {
  return useQuery({
    queryKey: ["rooms", params],
    queryFn: async () => {
      const response = await api.get<ApiResponse<FacilityRoom[]>>(
        "/facilities/rooms",
        { params },
      );
      return response.data.data;
    },
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<FacilityRoom>>(
        `/facilities/rooms/${id}`,
      );
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateRoomData {
  name: string;
  code?: string;
  buildingId: string;
  roomTypeId: string;
  floor: number;
  capacity?: number;
  length?: number;
  width?: number;
  notes?: string;
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomData) => {
      const response = await api.post<ApiResponse<FacilityRoom>>(
        "/facilities/rooms",
        data,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateRoomData & { isActive: boolean }>;
    }) => {
      const response = await api.put<ApiResponse<FacilityRoom>>(
        `/facilities/rooms/${id}`,
        data,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["rooms", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/facilities/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["facilities-summary"] });
    },
  });
}

// ==================== SUMMARY ====================

export function useFacilitySummary(unitId?: string) {
  return useQuery({
    queryKey: ["facilities-summary", unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<FacilitySummary>>(
        "/facilities/summary",
        {
          params: unitId ? { unitId } : undefined,
        },
      );
      return response.data.data;
    },
  });
}
