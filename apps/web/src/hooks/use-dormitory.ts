import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { ApiResponse, PaginatedResponse } from '@/lib/api';

// Dormitory (Asrama) entity
export interface Dormitory {
  id: string;
  name: string;
  code: string;
  type: DormitoryType;
  capacity: number;
  currentOccupancy?: number;
  unitId: string;
  unit?: {
    id: string;
    name: string;
  };
  supervisorId?: string;
  supervisor?: {
    id: string;
    name: string;
  };
  description?: string;
  facilities?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DormitoryType = 'MALE' | 'FEMALE';

export const DORMITORY_TYPES: { value: DormitoryType; label: string }[] = [
  { value: 'MALE', label: 'Putra' },
  { value: 'FEMALE', label: 'Putri' },
];

// Room entity
export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  currentOccupancy?: number;
  dormitoryId: string;
  dormitory?: Dormitory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Room assignment
export interface RoomAssignment {
  id: string;
  roomId: string;
  room?: Room;
  studentId: string;
  student?: {
    id: string;
    name: string;
    nis: string;
    gender: string;
  };
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DormitoryParams {
  page?: number;
  limit?: number;
  unitId?: string;
  type?: DormitoryType;
  isActive?: boolean;
}

export function useDormitories(params: DormitoryParams = {}) {
  return useQuery({
    queryKey: ['dormitories', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Dormitory>>('/dormitories', { params });
      return response.data;
    },
  });
}

export function useDormitory(id: string) {
  return useQuery({
    queryKey: ['dormitories', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Dormitory>>(`/dormitories/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export interface CreateDormitoryData {
  name: string;
  code: string;
  type: DormitoryType;
  capacity: number;
  unitId: string;
  supervisorId?: string;
  description?: string;
  facilities?: string;
  isActive?: boolean;
}

export function useCreateDormitory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDormitoryData) => {
      const response = await api.post<ApiResponse<Dormitory>>('/dormitories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dormitories'] });
    },
  });
}

export function useUpdateDormitory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateDormitoryData> }) => {
      const response = await api.patch<ApiResponse<Dormitory>>(`/dormitories/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dormitories'] });
      queryClient.invalidateQueries({ queryKey: ['dormitories', variables.id] });
    },
  });
}

export function useDeleteDormitory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dormitories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dormitories'] });
    },
  });
}

// Room hooks
export interface RoomParams {
  page?: number;
  limit?: number;
  dormitoryId?: string;
  floor?: number;
  isActive?: boolean;
}

export function useRooms(params: RoomParams = {}) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Room>>('/rooms', { params });
      return response.data;
    },
  });
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: ['rooms', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Room>>(`/rooms/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useDormitoryRooms(dormitoryId: string) {
  return useQuery({
    queryKey: ['dormitories', dormitoryId, 'rooms'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Room[]>>(`/dormitories/${dormitoryId}/rooms`);
      return response.data.data;
    },
    enabled: !!dormitoryId,
  });
}

export interface CreateRoomData {
  name: string;
  floor: number;
  capacity: number;
  dormitoryId: string;
  isActive?: boolean;
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRoomData) => {
      const response = await api.post<ApiResponse<Room>>('/rooms', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dormitories', variables.dormitoryId, 'rooms'] });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRoomData> }) => {
      const response = await api.patch<ApiResponse<Room>>(`/rooms/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.id] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

// Room Assignment hooks
export function useRoomAssignments(roomId: string) {
  return useQuery({
    queryKey: ['rooms', roomId, 'assignments'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RoomAssignment[]>>(`/rooms/${roomId}/assignments`);
      return response.data.data;
    },
    enabled: !!roomId,
  });
}

export function useStudentRoomAssignment(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'room-assignment'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RoomAssignment | null>>(
        `/students/${studentId}/room-assignment`
      );
      return response.data.data;
    },
    enabled: !!studentId,
  });
}

export interface AssignRoomData {
  roomId: string;
  studentId: string;
  startDate: string;
  endDate?: string;
}

export function useAssignRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignRoomData) => {
      const response = await api.post<ApiResponse<RoomAssignment>>('/room-assignments', data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.roomId, 'assignments'] });
      queryClient.invalidateQueries({ queryKey: ['students', variables.studentId, 'room-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dormitories'] });
    },
  });
}

export function useUnassignRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      await api.delete(`/room-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['dormitories'] });
    },
  });
}
