import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  CreateLetterInput,
  LetterDirection,
  LetterStatus,
  LetterDetail,
  CreateDispositionInput,
} from "@cipansor/shared";

interface GetLettersParams {
  unitId: string;
  page?: number;
  limit?: number;
  direction?: LetterDirection;
  status?: LetterStatus;
  search?: string;
  scope?: "ALL" | "PERSONAL" | "REVIEW";
}

export function useCorrespondence(unitId?: string) {
  const queryClient = useQueryClient();

  // Get Letters List
  const useLetters = (params: Omit<GetLettersParams, "unitId">) => {
    return useQuery({
      queryKey: ["letters", unitId, params],
      queryFn: async () => {
        if (!unitId)
          return {
            data: [],
            meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
          };
        const response = await api.get("/correspondence/letters", {
          params: { ...params, unitId },
        });
        return response.data;
      },
      enabled: !!unitId,
    });
  };

  // Get Single Letter
  const useLetter = (id: string) => {
    return useQuery({
      queryKey: ["letter", id],
      queryFn: async () => {
        const response = await api.get<{
          success: boolean;
          data: LetterDetail;
        }>(`/correspondence/letters/${id}`);
        return response.data.data;
      },
      enabled: !!id,
    });
  };

  // Create Letter
  const createLetter = useMutation({
    mutationFn: async (data: CreateLetterInput) => {
      const response = await api.post("/correspondence/letters", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
    },
  });

  // Review/Approve Letter
  const reviewLetter = useMutation({
    mutationFn: async ({
      id,
      action,
      notes,
    }: {
      id: string;
      action: "APPROVE" | "REJECT";
      notes?: string;
    }) => {
      const response = await api.post(`/correspondence/letters/${id}/review`, {
        action,
        notes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["letter", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["letters"] });
    },
  });

  // Create Disposition
  const createDisposition = useMutation({
    mutationFn: async (data: CreateDispositionInput) => {
      const response = await api.post("/correspondence/dispositions", data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["letter", variables.letterId],
      });
    },
  });

  // Update Disposition Status
  const updateDispositionStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: "IN_PROGRESS" | "COMPLETED";
      notes?: string;
    }) => {
      const response = await api.patch(
        `/correspondence/dispositions/${id}/status`,
        { status, notes },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      queryClient.invalidateQueries({ queryKey: ["letter"] });
    },
  });

  // Get Stats
  const useStats = () => {
    return useQuery({
      queryKey: ["letters", "stats", unitId],
      queryFn: async () => {
        if (!unitId) return null;
        const response = await api.get("/correspondence/stats", {
          params: { unitId },
        });
        return response.data.data;
      },
      enabled: !!unitId,
    });
  };

  return {
    useLetters,
    useLetter,
    createLetter,
    reviewLetter,
    createDisposition,
    updateDispositionStatus,
    useStats,
  };
}
