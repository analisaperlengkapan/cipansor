import { z } from 'zod';
import { BookStatus, BorrowingStatus } from '@cipansor/shared';

// Book Category schemas
export const createBookCategorySchema = z.object({
  unitId: z.string().uuid(),
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
});

export const updateBookCategorySchema = createBookCategorySchema.partial().omit({ unitId: true });

// Book schemas
export const createBookSchema = z.object({
  unitId: z.string().uuid(),
  categoryId: z.string().uuid(),
  isbn: z.string().optional(),
  title: z.string().min(1).max(255),
  author: z.string().min(1).max(255),
  publisher: z.string().optional(),
  publishYear: z.number().int().min(1900).max(2100).optional(),
  language: z.string().default('Indonesia'),
  pageCount: z.number().int().positive().optional(),
  shelfLocation: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  coverUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export const updateBookSchema = createBookSchema.partial().omit({ unitId: true });

export const queryBookSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  unitId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(BookStatus).optional(),
});

// Book Copy schemas
export const createBookCopySchema = z.object({
  code: z.string().min(1).max(50), // Barcode
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST', 'REPAIR']).default('GOOD'),
  location: z.string().optional(),
  status: z.enum(['AVAILABLE', 'BORROWED', 'MAINTENANCE', 'LOST']).default('AVAILABLE'),
});

// Borrowing schemas
export const createBorrowingSchema = z
  .object({
    bookId: z.string().uuid(),
    copyId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    borrowerId: z.string().uuid().optional(),
    borrowerType: z.enum(['STUDENT', 'STAFF', 'TEACHER']).optional().default('STUDENT'),
    dueDate: z.coerce.date(),
    notes: z.string().optional(),
  })
  .refine((data) => data.studentId || data.borrowerId, {
    message: 'Either studentId or borrowerId must be provided',
    path: ['studentId'],
  });

export const returnBookSchema = z.object({
  lateFee: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  condition: z.enum(['GOOD', 'DAMAGED', 'LOST', 'REPAIR']).optional(), // Condition on return
});

export const queryBorrowingSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  bookId: z.string().uuid().optional(),
  borrowerId: z.string().uuid().optional(),
  status: z.nativeEnum(BorrowingStatus).optional(),
  overdue: z.coerce.boolean().optional(),
});

export type CreateBookCategoryInput = z.infer<typeof createBookCategorySchema>;
export type UpdateBookCategoryInput = z.infer<typeof updateBookCategorySchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type QueryBookInput = z.infer<typeof queryBookSchema>;
export type CreateBookCopyInput = z.infer<typeof createBookCopySchema>;
export type CreateBorrowingInput = z.infer<typeof createBorrowingSchema>;
export type ReturnBookInput = z.infer<typeof returnBookSchema>;
export type QueryBorrowingInput = z.infer<typeof queryBorrowingSchema>;
