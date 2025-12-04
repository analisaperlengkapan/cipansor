import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { PaginatedResponse } from '@/lib/api';

// Types
export type BookCategory = 'ISLAMIC' | 'ACADEMIC' | 'FICTION' | 'NON_FICTION' | 'REFERENCE' | 'OTHER';
export type BorrowStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE' | 'LOST';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  category: BookCategory;
  description?: string;
  quantity: number;
  availableQuantity: number;
  location?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Borrow {
  id: string;
  bookId: string;
  studentId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: BorrowStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  book?: Book;
  student?: {
    id: string;
    name: string;
    nis: string;
    class?: { name: string };
  };
}

// Constants
export const BOOK_CATEGORIES: { value: BookCategory; label: string }[] = [
  { value: 'ISLAMIC', label: 'Keislaman' },
  { value: 'ACADEMIC', label: 'Akademik' },
  { value: 'FICTION', label: 'Fiksi' },
  { value: 'NON_FICTION', label: 'Non-Fiksi' },
  { value: 'REFERENCE', label: 'Referensi' },
  { value: 'OTHER', label: 'Lainnya' },
];

export const BORROW_STATUSES: { value: BorrowStatus; label: string; color: string }[] = [
  { value: 'BORROWED', label: 'Dipinjam', color: 'bg-blue-100 text-blue-800' },
  { value: 'RETURNED', label: 'Dikembalikan', color: 'bg-green-100 text-green-800' },
  { value: 'OVERDUE', label: 'Terlambat', color: 'bg-red-100 text-red-800' },
  { value: 'LOST', label: 'Hilang', color: 'bg-gray-100 text-gray-800' },
];

// Books Hooks
export function useBooks(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: BookCategory;
}) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Book>>('/library/books', { params });
      return response.data;
    },
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: async () => {
      const response = await api.get<Book>(`/library/books/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      author: string;
      isbn?: string;
      publisher?: string;
      publishYear?: number;
      category: BookCategory;
      description?: string;
      quantity: number;
      location?: string;
    }) => {
      const response = await api.post<Book>('/library/books', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        title: string;
        author: string;
        isbn: string;
        publisher: string;
        publishYear: number;
        category: BookCategory;
        description: string;
        quantity: number;
        location: string;
      }>;
    }) => {
      const response = await api.put<Book>(`/library/books/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/library/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

// Borrow Hooks
export function useBorrows(params?: {
  page?: number;
  limit?: number;
  studentId?: string;
  bookId?: string;
  status?: BorrowStatus;
}) {
  return useQuery({
    queryKey: ['borrows', params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Borrow>>('/library/borrows', { params });
      return response.data;
    },
  });
}

export function useBorrow(id: string) {
  return useQuery({
    queryKey: ['borrows', id],
    queryFn: async () => {
      const response = await api.get<Borrow>(`/library/borrows/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useStudentBorrows(studentId: string) {
  return useQuery({
    queryKey: ['borrows', 'student', studentId],
    queryFn: async () => {
      const response = await api.get<Borrow[]>(`/library/borrows/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId,
  });
}

export function useCreateBorrow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      bookId: string;
      studentId: string;
      borrowDate: string;
      dueDate: string;
      notes?: string;
    }) => {
      const response = await api.post<Borrow>('/library/borrows', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useReturnBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, returnDate }: { id: string; returnDate: string }) => {
      const response = await api.put<Borrow>(`/library/borrows/${id}/return`, { returnDate });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

export function useMarkLost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put<Borrow>(`/library/borrows/${id}/lost`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
    },
  });
}

// Library Summary Hook
export function useLibrarySummary() {
  return useQuery({
    queryKey: ['library', 'summary'],
    queryFn: async () => {
      const response = await api.get<{
        totalBooks: number;
        totalQuantity: number;
        totalBorrowed: number;
        totalOverdue: number;
        byCategory: { category: BookCategory; count: number }[];
        popularBooks: { bookId: string; title: string; borrowCount: number }[];
      }>('/library/summary');
      return response.data;
    },
  });
}

// Get overdue borrows
export function useOverdueBorrows() {
  return useQuery({
    queryKey: ['borrows', 'overdue'],
    queryFn: async () => {
      const response = await api.get<Borrow[]>('/library/borrows/overdue');
      return response.data;
    },
  });
}
