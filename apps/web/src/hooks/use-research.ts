import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { PaginatedResponse, ApiResponse } from "@/lib/api";
import {
  CreateResearchProposalInput,
  UpdateResearchProposalInput,
  CreateResearchOutputInput,
  UpdateResearchOutputInput,
  ResearchStatus,
  ResearchCategory,
  ResearchOutputType
} from '@cipansor/shared';

// Define local types for Responses if shared doesn't have "Entity" types with IDs
// Usually Shared has DTOs (Input). The API returns the Prisma model structure + relations.
// I will define basic interfaces here matching what the API returns.

export interface ResearchProposal {
  id: string;
  unitId: string;
  academicYearId: string;
  researcherId: string;
  title: string;
  abstract?: string;
  category: ResearchCategory;
  budgetProposed: number;
  status: ResearchStatus;
  documents?: string[];
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
  researcher: {
    id: string;
    name: string;
    email: string;
  };
  unit: {
    id: string;
    name: string;
  };
  outputs?: ResearchOutput[];
}

export interface ResearchOutput {
  id: string;
  proposalId?: string;
  researcherId: string;
  type: ResearchOutputType;
  title: string;
  publicationDate?: string;
  publisher?: string;
  url?: string;
  citation?: string;
  fileUrl?: string;
  createdAt: string;
  researcher?: {
    id: string;
    name: string;
  };
  proposal?: {
    id: string;
    title: string;
  };
}

export interface ResearchListParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  academicYearId?: string;
  status?: ResearchStatus;
  category?: ResearchCategory;
  researcherId?: string;
}

export interface OutputListParams {
  page?: number;
  limit?: number;
  search?: string;
  unitId?: string;
  researcherId?: string;
}

// --- Proposals Hooks ---

export function useResearchProposals(params: ResearchListParams = {}) {
  return useQuery({
    queryKey: ["research-proposals", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<ResearchProposal>>("/research/proposals", {
        params,
      });
      return response.data;
    },
  });
}

export function useResearchProposal(id: string) {
  return useQuery({
    queryKey: ["research-proposals", id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ResearchProposal>>(`/research/proposals/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateResearchProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateResearchProposalInput) => {
      const response = await api.post<ApiResponse<ResearchProposal>>("/research/proposals", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-proposals"] });
    },
  });
}

export function useUpdateResearchProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateResearchProposalInput }) => {
      const response = await api.put<ApiResponse<ResearchProposal>>(`/research/proposals/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["research-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["research-proposals", variables.id] });
    },
  });
}

export function useDeleteResearchProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/research/proposals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-proposals"] });
    },
  });
}

// --- Outputs Hooks ---

export function useResearchOutputs(params: OutputListParams = {}) {
  return useQuery({
    queryKey: ["research-outputs", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<ResearchOutput>>("/research/outputs", {
        params,
      });
      return response.data;
    },
  });
}

export function useCreateResearchOutput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateResearchOutputInput) => {
      const response = await api.post<ApiResponse<ResearchOutput>>("/research/outputs", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-outputs"] });
      queryClient.invalidateQueries({ queryKey: ["research-proposals"] }); // Invalidate proposals too as outputs might link to them
    },
  });
}

export function useUpdateResearchOutput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateResearchOutputInput }) => {
      const response = await api.put<ApiResponse<ResearchOutput>>(`/research/outputs/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-outputs"] });
      queryClient.invalidateQueries({ queryKey: ["research-proposals"] });
    },
  });
}

export function useDeleteResearchOutput() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/research/outputs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-outputs"] });
      queryClient.invalidateQueries({ queryKey: ["research-proposals"] });
    },
  });
}
