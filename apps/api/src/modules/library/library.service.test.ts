import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as service from './service';

// Mock prisma
vi.mock('../../lib/prisma', () => ({
  prisma: {
    book: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    bookCopy: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    borrowing: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Library Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addBookCopy', () => {
    it('should create a copy and update book quantity', async () => {
      const bookId = 'book-1';
      const data = { code: 'BC-001' };

      (prisma.bookCopy.findUnique as any).mockResolvedValue(null);
      (prisma.bookCopy.create as any).mockResolvedValue({ id: 'copy-1', ...data });
      (prisma.book.update as any).mockResolvedValue({});

      const result = await service.addBookCopy(bookId, data);

      expect(prisma.bookCopy.create).toHaveBeenCalledWith({
        data: { ...data, bookId },
      });
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: bookId },
        data: { quantity: { increment: 1 }, available: { increment: 1 } },
      });
      expect(result).toBeDefined();
    });

    it('should throw if barcode exists', async () => {
      const bookId = 'book-1';
      const data = { code: 'BC-001' };

      (prisma.bookCopy.findUnique as any).mockResolvedValue({ id: 'existing' });

      await expect(service.addBookCopy(bookId, data)).rejects.toThrow('Barcode/Code already exists');
    });
  });

  describe('createBorrowing', () => {
    it('should borrow with copyId', async () => {
      const input = {
        bookId: 'book-1',
        copyId: 'copy-1',
        studentId: 'student-1',
        dueDate: new Date(),
      };
      const processedBy = 'admin';

      // Mock Copy
      (prisma.bookCopy.findUnique as any).mockResolvedValue({
        id: 'copy-1',
        status: 'AVAILABLE'
      });

      // Mock Book
      (prisma.book.findUnique as any).mockResolvedValue({
        id: 'book-1',
        available: 5
      });

      // Mock Borrowing Create
      (prisma.borrowing.create as any).mockResolvedValue({ id: 'borrow-1' });

      await service.createBorrowing(input, processedBy);

      // Verify Copy Status Update
      expect(prisma.bookCopy.update).toHaveBeenCalledWith({
        where: { id: 'copy-1' },
        data: { status: 'BORROWED' },
      });

      // Verify Book Available Decrement
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: {
          available: { decrement: 1 },
          status: 'AVAILABLE' // Since 5 > 1
        },
      });
    });

    it('should throw if copy is not available', async () => {
      const input = {
        bookId: 'book-1',
        copyId: 'copy-1',
        studentId: 'student-1',
        dueDate: new Date(),
      };

      (prisma.bookCopy.findUnique as any).mockResolvedValue({
        id: 'copy-1',
        status: 'BORROWED'
      });

      await expect(service.createBorrowing(input, 'admin')).rejects.toThrow('Book copy is not available');
    });
  });

  describe('returnBook', () => {
    it('should return book and update copy status', async () => {
      const borrowId = 'borrow-1';
      const data = { notes: 'Good' };
      const processedBy = 'admin';

      (prisma.borrowing.findUnique as any).mockResolvedValue({
        id: borrowId,
        bookId: 'book-1',
        copyId: 'copy-1',
        status: 'ACTIVE',
        dueDate: new Date(Date.now() + 10000), // Future
        copy: { condition: 'GOOD' }
      });

      await service.returnBook(borrowId, data, processedBy);

      // Verify Copy Update
      expect(prisma.bookCopy.update).toHaveBeenCalledWith({
        where: { id: 'copy-1' },
        data: { status: 'AVAILABLE', condition: 'GOOD' },
      });

      // Verify Book Available Increment
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: { available: { increment: 1 }, status: 'AVAILABLE' },
      });
    });
  });
});
