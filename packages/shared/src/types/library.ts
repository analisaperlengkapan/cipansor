import { BookStatus, BorrowingStatus } from "./enums";

export interface BookCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  unitId?: string;
  unit?: {
    id: string;
    name: string;
  };
  _count?: {
    books: number;
  };
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishYear?: number;
  language?: string;
  pageCount?: number;
  shelfLocation?: string;
  quantity: number;
  available: number;
  coverUrl?: string;
  description?: string;
  status: BookStatus;
  category: BookCategory;
  unit?: {
    id: string;
    name: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  code: string;
  condition: string;
  status: string;
  location?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  book?: Book;
}

export interface BorrowingStudent {
  name: string;
  nis: string;
  class?: {
    name: string;
  };
}

export interface Borrowing {
  id: string;
  bookId: string;
  copyId?: string;
  studentId?: string;
  borrowerId: string; // Legacy/Generic
  borrowerType: string;
  borrowedAt: Date | string;
  dueDate: Date | string;
  returnedAt?: Date | string;
  status: BorrowingStatus;
  lateFee?: number;
  notes?: string;
  book?: {
    id: string;
    title: string;
    author: string;
    isbn?: string;
    category?: {
      id: string;
      name: string;
    };
  };
  copy?: BookCopy;
  student?: BorrowingStudent;
  processedByUser?: {
    id: string;
    name: string;
  };
}

export interface CreateBorrowingInput {
  bookId: string;
  copyId?: string;
  studentId?: string;
  borrowerId?: string;
  borrowerType: "STUDENT" | "STAFF" | "TEACHER";
  dueDate: Date | string;
  notes?: string;
}

export interface ReturnBookInput {
  lateFee?: number;
  notes?: string;
  condition?: string;
}

export interface LibraryStats {
  totalTitles: number;
  totalBooks: number;
  availableBooks: number;
  totalCategories: number;
  activeBorrowings: number;
  overdueBorrowings: number;
}
