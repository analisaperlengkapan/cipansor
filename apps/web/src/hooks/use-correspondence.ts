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
  scope?: "ALL" | "PERSONAL";
}

export function useCorrespondence(unitId?: string) {
  const queryClient = useQueryClient();

  // Get Letters List
  //
  // Deliberately NOT gated on `unitId`. Foundation-level accounts — the
  // sekretaris and ketua yayasan, who are the middle of every routing chain —
  // have no unit, so `enabled: !!unitId` meant their e-office page fetched
  // nothing and rendered empty. The server decides scope now: omitting unitId
  // asks for "everything I am entitled to", which for a unit-scoped user is
  // still only their own unit.
  const useLetters = (params: Omit<GetLettersParams, "unitId">) => {
    return useQuery({
      queryKey: ["letters", unitId ?? "all", params],
      queryFn: async () => {
        const response = await api.get("/correspondence/letters", {
          params: unitId ? { ...params, unitId } : params,
        });
        return response.data;
      },
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
      nextReviewerId,
      isFinalSigner,
    }: {
      id: string;
      action: "APPROVE" | "REJECT";
      notes?: string;
      nextReviewerId?: string;
      isFinalSigner?: boolean;
    }) => {
      const response = await api.post(`/correspondence/letters/${id}/review`, {
        action,
        notes,
        nextReviewerId,
        isFinalSigner,
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

  // Get Stats — same reasoning as useLetters: no unit is a valid scope, not a
  // reason to skip the request.
  const useStats = () => {
    return useQuery({
      queryKey: ["letters", "stats", unitId ?? "all"],
      queryFn: async () => {
        const response = await api.get("/correspondence/stats", {
          params: unitId ? { unitId } : undefined,
        });
        return response.data.data;
      },
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
