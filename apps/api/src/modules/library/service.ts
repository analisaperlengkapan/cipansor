import { Prisma, BookStatus, BorrowingStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import type {
  CreateBookCategoryInput,
  UpdateBookCategoryInput,
  CreateBookInput,
  UpdateBookInput,
  QueryBookInput,
  CreateBookCopyInput,
  CreateBorrowingInput,
  ReturnBookInput,
  QueryBorrowingInput,
} from './schema';

// ==================== BOOK CATEGORY ====================

export async function getBookCategories(unitId?: string) {
  return prisma.bookCategory.findMany({
    where: unitId ? { unitId } : undefined,
    include: {
      unit: { select: { id: true, name: true } },
      _count: { select: { books: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getBookCategoryById(id: string) {
  return prisma.bookCategory.findUnique({
    where: { id },
    include: {
      unit: { select: { id: true, name: true } },
      _count: { select: { books: true } },
    },
  });
}

export async function createBookCategory(data: CreateBookCategoryInput) {
  return prisma.bookCategory.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data as any,
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function updateBookCategory(id: string, data: UpdateBookCategoryInput) {
  return prisma.bookCategory.update({
    where: { id },
    data,
    include: {
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function deleteBookCategory(id: string) {
  return prisma.bookCategory.delete({ where: { id } });
}

// ==================== BOOK ====================

export async function getBooks(query: QueryBookInput) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  const { unitId, categoryId, search, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BookWhereInput = {
    deletedAt: null,
    ...(unitId && { unitId: unitId as string }),
    ...(categoryId && { categoryId: categoryId as string }),
    ...(status && { status: status as BookStatus }),
    ...(search && {
      OR: [
        { title: { contains: search as string, mode: 'insensitive' } },
        { author: { contains: search as string, mode: 'insensitive' } },
        { isbn: { contains: search as string, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: {
        unit: { select: { id: true, name: true } },
        category: { select: { id: true, name: true, code: true } },
        _count: { select: { borrowings: { where: { status: BorrowingStatus.ACTIVE } } } },
      },
      orderBy: { title: 'asc' },
    }),
    prisma.book.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBookById(id: string) {
  return prisma.book.findUnique({
    where: { id, deletedAt: null },
    include: {
      unit: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, code: true } },
      copies: { orderBy: { code: 'asc' } }, // Include copies
      borrowings: {
        where: { status: BorrowingStatus.ACTIVE },
        include: {
          processedByUser: { select: { id: true, name: true } },
          copy: true, // Include copy info
        },
        orderBy: { borrowedAt: 'desc' },
        take: 5,
      },
    },
  });
}

export async function createBook(data: CreateBookInput) {
  return prisma.book.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...data,
      available: data.quantity,
    } as any,
    include: {
      unit: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function updateBook(id: string, data: UpdateBookInput) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) return null;

  // If quantity changes, adjust available accordingly
  let available = book.available;
  if (data.quantity !== undefined) {
    const borrowed = book.quantity - book.available;
    available = Math.max(0, data.quantity - borrowed);
  }

  return prisma.book.update({
    where: { id },
    data: {
      ...data,
      available,
    },
    include: {
      unit: { select: { id: true, name: true } },
      category: { select: { id: true, name: true, code: true } },
    },
  });
}

export async function deleteBook(id: string) {
  return prisma.book.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ==================== BOOK COPY ====================

export async function addBookCopy(bookId: string, data: CreateBookCopyInput) {
  return prisma.$transaction(async (tx) => {
    // Check if code exists
    const existing = await tx.bookCopy.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new Error('Barcode/Code already exists');
    }

    const copy = await tx.bookCopy.create({
      data: {
        ...data,
        bookId,
      },
    });

    // Increment Book quantity and available
    await tx.book.update({
      where: { id: bookId },
      data: {
        quantity: { increment: 1 },
        available: { increment: 1 },
      },
    });

    return copy;
  });
}

export async function getBookCopies(bookId: string) {
  return prisma.bookCopy.findMany({
    where: { bookId },
    orderBy: { code: 'asc' },
    include: {
      borrowings: {
        where: { status: BorrowingStatus.ACTIVE },
        take: 1,
        include: {
           student: { select: { name: true } },
           book: { select: { title: true } }
        }
      }
    }
  });
}

export async function findCopyByCode(code: string) {
  return prisma.bookCopy.findUnique({
    where: { code },
    include: {
      book: {
        include: {
          category: true,
          unit: true,
        },
      },
      borrowings: {
        where: { status: BorrowingStatus.ACTIVE },
        take: 1,
        include: {
           student: true
        }
      }
    },
  });
}

// ==================== BORROWING ====================

export async function getBorrowings(query: QueryBorrowingInput) {
  const { page, limit, bookId, borrowerId, status, overdue } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.BorrowingWhereInput = {
    ...(bookId && { bookId }),
    ...(borrowerId && { borrowerId }),
    ...(status && { status }),
    ...(overdue && {
      status: BorrowingStatus.ACTIVE,
      dueDate: { lt: new Date() },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.borrowing.findMany({
      where,
      skip,
      take: limit,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            category: { select: { id: true, name: true } },
          },
        },
        copy: true, // Include copy details
        student: { select: { name: true, nis: true, class: { select: { name: true } } } },
        processedByUser: { select: { id: true, name: true } },
      },
      orderBy: { borrowedAt: 'desc' },
    }),
    prisma.borrowing.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getBorrowingById(id: string) {
  return prisma.borrowing.findUnique({
    where: { id },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          isbn: true,
          category: { select: { id: true, name: true } },
        },
      },
      copy: true,
      processedByUser: { select: { id: true, name: true } },
    },
  });
}

export async function createBorrowing(data: CreateBorrowingInput, processedBy: string) {
  const studentId = data.studentId;
  const borrowerId = data.borrowerId || studentId;
  const borrowerType = data.borrowerType || (studentId ? 'STUDENT' : 'STAFF');

  if (!borrowerId) {
    throw new Error('Borrower ID is required');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Check Copy Logic (if copyId provided)
    if (data.copyId) {
      const copy = await tx.bookCopy.findUnique({ where: { id: data.copyId } });
      if (!copy) throw new Error('Copy not found');
      if (copy.status !== 'AVAILABLE') throw new Error('Book copy is not available');

      // Update copy status
      await tx.bookCopy.update({
        where: { id: data.copyId },
        data: { status: 'BORROWED' },
      });
    }

    // 2. Check Book Availability (Global)
    // Even if copy is selected, we must ensure Book.available > 0 logic holds for consistency
    const book = await tx.book.findUnique({ where: { id: data.bookId } });
    if (!book || book.available < 1) {
      throw new Error('Book not available for borrowing');
    }

    // 3. Create Borrowing
    const borrowing = await tx.borrowing.create({
      data: {
        bookId: data.bookId,
        copyId: data.copyId,
        studentId: studentId,
        borrowerId: borrowerId,
        borrowerType: borrowerType,
        dueDate: data.dueDate,
        notes: data.notes,
        processedBy,
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        copy: true,
        student: { select: { name: true, nis: true, class: { select: { name: true } } } },
        processedByUser: { select: { id: true, name: true } },
      },
    });

    // 4. Update Book Availability
    await tx.book.update({
      where: { id: data.bookId },
      data: {
        available: { decrement: 1 },
        status: book.available === 1 ? BookStatus.BORROWED : BookStatus.AVAILABLE,
      },
    });

    return borrowing;
  });
}

export async function returnBook(id: string, data: ReturnBookInput, processedBy: string) {
  const borrowing = await prisma.borrowing.findUnique({
    where: { id },
    include: { book: true, copy: true },
  });

  if (!borrowing || borrowing.status !== BorrowingStatus.ACTIVE) {
    throw new Error('Borrowing not found or already returned');
  }

  const isOverdue = new Date() > borrowing.dueDate;

  return prisma.$transaction(async (tx) => {
    // 1. Update Borrowing
    const updated = await tx.borrowing.update({
      where: { id },
      data: {
        returnedAt: new Date(),
        status: BorrowingStatus.RETURNED,
        lateFee: data.lateFee,
        notes: data.notes,
      },
      include: {
        book: { select: { id: true, title: true, author: true } },
        processedByUser: { select: { id: true, name: true } },
      },
    });

    // 2. Update Copy (if exists)
    if (borrowing.copyId) {
      await tx.bookCopy.update({
        where: { id: borrowing.copyId },
        data: {
          status: 'AVAILABLE',
          condition: data.condition || borrowing.copy?.condition || 'GOOD',
        },
      });
    }

    // 3. Update Book Availability
    await tx.book.update({
      where: { id: borrowing.bookId },
      data: {
        available: { increment: 1 },
        status: BookStatus.AVAILABLE,
      },
    });

    return { ...updated, wasOverdue: isOverdue };
  });
}

export async function markAsLost(id: string) {
  const borrowing = await prisma.borrowing.findUnique({
    where: { id },
    include: { book: true, copy: true },
  });

  if (!borrowing || borrowing.status !== BorrowingStatus.ACTIVE) {
    throw new Error('Borrowing not found or already returned');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.borrowing.update({
      where: { id },
      data: { status: BorrowingStatus.LOST },
    });

    // Update Copy if exists
    if (borrowing.copyId) {
      await tx.bookCopy.update({
        where: { id: borrowing.copyId },
        data: { status: 'LOST', condition: 'LOST' },
      });
    }

    await tx.book.update({
      where: { id: borrowing.bookId },
      data: {
        quantity: { decrement: 1 },
        status: borrowing.book.available === 0 ? BookStatus.LOST : BookStatus.AVAILABLE,
      },
    });

    return updated;
  });
}

// ==================== STATISTICS ====================

export async function getLibraryStats(unitId: string) {
  const [totalBooks, totalCategories, activeBorrowingsData] = await Promise.all([
    prisma.book.aggregate({
      where: { unitId, deletedAt: null },
      _sum: { quantity: true, available: true },
      _count: true,
    }),
    prisma.bookCategory.count({ where: { unitId } }),
    prisma.borrowing.findMany({
      where: {
        book: { unitId },
        status: BorrowingStatus.ACTIVE,
      },
      select: { dueDate: true },
    }),
  ]);

  const activeBorrowings = activeBorrowingsData.length;
  const now = new Date();
  const overdueBorrowings = activeBorrowingsData.filter((b) => b.dueDate < now).length;

  return {
    totalTitles: totalBooks._count,
    totalBooks: totalBooks._sum.quantity || 0,
    availableBooks: totalBooks._sum.available || 0,
    totalCategories,
    activeBorrowings,
    overdueBorrowings,
  };
}
