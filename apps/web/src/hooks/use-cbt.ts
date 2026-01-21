import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, SharedPaginatedResponse } from "@/lib/api";

// Types
export enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  ESSAY = "ESSAY",
  TRUE_FALSE = "TRUE_FALSE",
}

export interface Question {
  id: string;
  bankId: string;
  type: QuestionType;
  content: string;
  options?: any;
  answerKey?: any;
  explanation?: string;
  points: number;
  order: number;
}

export interface QuestionBank {
  id: string;
  unitId: string;
  teacherId: string;
  subjectId?: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherRel?: { user: { name: string } };
  subject?: { name: string; code: string };
  questions?: Question[];
  _count?: { questions: number; exams: number };
}

export interface ExamAttempt {
  id: string;
  examId: string;
  studentId: string;
  startedAt: string;
  finishedAt?: string;
  score?: number;
  status: "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  exam?: any;
  answers?: any[];
}

// Hooks

export const useQuestionBanks = (params?: any) => {
  return useQuery({
    queryKey: ["question-banks", params],
    queryFn: async () => {
      const { data } = await api.get("/cbt/banks", { params });
      return data;
    },
  });
};

export const useQuestionBank = (id: string) => {
  return useQuery({
    queryKey: ["question-bank", id],
    queryFn: async () => {
      const { data } = await api.get(`/cbt/banks/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateQuestionBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post("/cbt/banks", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
    },
  });
};

export const useDeleteQuestionBank = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cbt/banks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question-banks"] });
    },
  });
};

// Questions

export const useAddQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bankId, data }: { bankId: string; data: any }) => {
      const { data: res } = await api.post(
        `/cbt/banks/${bankId}/questions`,
        data,
      );
      return res.data;
    },
    onSuccess: (_, { bankId }) => {
      queryClient.invalidateQueries({ queryKey: ["question-bank", bankId] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bankId,
      questionId,
      data,
    }: {
      bankId: string;
      questionId: string;
      data: any;
    }) => {
      const { data: res } = await api.put(
        `/cbt/banks/${bankId}/questions/${questionId}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_, { bankId }) => {
      queryClient.invalidateQueries({ queryKey: ["question-bank", bankId] });
    },
  });
};

export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      bankId,
      questionId,
    }: {
      bankId: string;
      questionId: string;
    }) => {
      await api.delete(`/cbt/banks/${bankId}/questions/${questionId}`);
    },
    onSuccess: (_, { bankId }) => {
      queryClient.invalidateQueries({ queryKey: ["question-bank", bankId] });
    },
  });
};

// Student Exam

export const useStartExam = () => {
  return useMutation({
    mutationFn: async (examId: string) => {
      const { data } = await api.post(`/cbt/exams/${examId}/start`);
      return data.data;
    },
  });
};

export const useExamAttempt = (attemptId: string) => {
  return useQuery({
    queryKey: ["exam-attempt", attemptId],
    queryFn: async () => {
      const { data } = await api.get(`/cbt/attempts/${attemptId}`);
      return data.data;
    },
    enabled: !!attemptId,
    // Disable refetch on window focus to avoid resetting UI state unexpectedly
    refetchOnWindowFocus: false,
  });
};

export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: async ({
      attemptId,
      questionId,
      answer,
    }: {
      attemptId: string;
      questionId: string;
      answer: any;
    }) => {
      await api.post(`/cbt/attempts/${attemptId}/answer`, {
        questionId,
        answer,
      });
    },
  });
};

export const useFinishExam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: string) => {
      const { data } = await api.post(`/cbt/attempts/${attemptId}/finish`);
      return data.data;
    },
    onSuccess: (data, attemptId) => {
      queryClient.invalidateQueries({ queryKey: ["exam-attempt", attemptId] });
    },
  });
};
