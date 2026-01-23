import type { Request, Response, NextFunction } from 'express';
import * as service from './service';
import {
  createBookCategorySchema,
  updateBookCategorySchema,
  createBookSchema,
  updateBookSchema,
  queryBookSchema,
  createBorrowingSchema,
  returnBookSchema,
  queryBorrowingSchema,
} from './schema';
import { Errors } from '../../middleware/error';

// ==================== BOOK CATEGORY ====================

export async function getBookCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const unitId = req.query.unitId as string | undefined;
    const categories = await service.getBookCategories(unitId);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getBookCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.getBookCategoryById(req.params.id);
    if (!category) {
      throw Errors.notFound('Book category not found');
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function createBookCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBookCategorySchema.parse(req.body);
    const category = await service.createBookCategory(data);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateBookCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateBookCategorySchema.parse(req.body);
    const category = await service.updateBookCategory(req.params.id, data);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteBookCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteBookCategory(req.params.id);
    res.json({ success: true, message: 'Book category deleted' });
  } catch (error) {
    next(error);
  }
}

// ==================== BOOK ====================

export async function getBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryBookSchema.parse(req.query);
    const result = await service.getBooks(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getBookById(req: Request, res: Response, next: NextFunction) {
  try {
    const book = await service.getBookById(req.params.id);
    if (!book) {
      throw Errors.notFound('Book not found');
    }
    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}

export async function createBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBookSchema.parse(req.body);
    const book = await service.createBook(data);
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}

export async function updateBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateBookSchema.parse(req.body);
    const book = await service.updateBook(req.params.id, data);
    if (!book) {
      throw Errors.notFound('Book not found');
    }
    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
}

export async function deleteBook(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteBook(req.params.id);
    res.json({ success: true, message: 'Book deleted' });
  } catch (error) {
    next(error);
  }
}

// ==================== BORROWING ====================

export async function getBorrowings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryBorrowingSchema.parse(req.query);
    const result = await service.getBorrowings(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getBorrowingById(req: Request, res: Response, next: NextFunction) {
  try {
    const borrowing = await service.getBorrowingById(req.params.id);
    if (!borrowing) {
      throw Errors.notFound('Borrowing record not found');
    }
    res.json({ success: true, data: borrowing });
  } catch (error) {
    next(error);
  }
}

export async function createBorrowing(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBorrowingSchema.parse(req.body);
    const borrowing = await service.createBorrowing(data, req.user!.sub);
    res.status(201).json({ success: true, data: borrowing });
  } catch (error) {
    next(error);
  }
}

export async function returnBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = returnBookSchema.parse(req.body);
    const result = await service.returnBook(req.params.id, data, req.user!.sub);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function markAsLost(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.markAsLost(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

// ==================== STATISTICS ====================

export async function getLibraryStats(req: Request, res: Response, next: NextFunction) {
  try {
    const unitId = req.params.unitId;
    const stats = await service.getLibraryStats(unitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
