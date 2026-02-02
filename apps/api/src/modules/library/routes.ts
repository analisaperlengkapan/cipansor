import { Router } from 'express';
import { UserRole } from '@prisma/client';
import * as controller from './controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validateQuery } from '../../middleware/error';
import { queryBookSchema, queryBorrowingSchema } from './schema';

const router = Router();

router.use(authenticate);

// ==================== BOOK CATEGORIES ====================

/**
 * @swagger
 * /api/library/categories:
 *   get:
 *     summary: List book categories
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of book categories
 */
router.get('/categories', controller.getBookCategories);

/**
 * @swagger
 * /api/library/categories/{id}:
 *   get:
 *     summary: Get book category by ID
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book category details
 */
router.get('/categories/:id', controller.getBookCategoryById);

/**
 * @swagger
 * /api/library/categories:
 *   post:
 *     summary: Create book category
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
  '/categories',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createBookCategory
);

/**
 * @swagger
 * /api/library/categories/{id}:
 *   put:
 *     summary: Update book category
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put(
  '/categories/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.updateBookCategory
);

/**
 * @swagger
 * /api/library/categories/{id}:
 *   delete:
 *     summary: Delete book category
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted
 */
router.delete(
  '/categories/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteBookCategory
);

// ==================== BOOKS ====================

/**
 * @swagger
 * /api/library/books:
 *   get:
 *     summary: List books
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, author, or ISBN
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of books
 */
router.get('/books', validateQuery(queryBookSchema), controller.getBooks);

/**
 * @swagger
 * /api/library/books/{id}:
 *   get:
 *     summary: Get book by ID
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book details with availability
 */
router.get('/books/:id', controller.getBookById);

/**
 * @swagger
 * /api/library/books:
 *   post:
 *     summary: Add new book
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - categoryId
 *               - unitId
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               isbn:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               publisher:
 *                 type: string
 *               year:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Book added
 */
router.post(
  '/books',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createBook
);

/**
 * @swagger
 * /api/library/books/{id}:
 *   put:
 *     summary: Update book
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book updated
 */
router.put(
  '/books/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.updateBook
);

/**
 * @swagger
 * /api/library/books/{id}:
 *   delete:
 *     summary: Delete book
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Book deleted
 */
router.delete(
  '/books/:id',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.deleteBook
);

// ==================== BOOK COPIES ====================

/**
 * @swagger
 * /api/library/books/{id}/copies:
 *   get:
 *     summary: Get book copies
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of book copies
 */
router.get('/books/:id/copies', controller.getBookCopies);

/**
 * @swagger
 * /api/library/books/{id}/copies:
 *   post:
 *     summary: Add book copy
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *               condition:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Copy added
 */
router.post(
  '/books/:id/copies',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.addBookCopy
);

/**
 * @swagger
 * /api/library/copies/{code}:
 *   get:
 *     summary: Find copy by barcode
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Copy details
 */
router.get('/copies/:code', controller.findCopyByCode);

// ==================== BORROWINGS ====================

/**
 * @swagger
 * /api/library/borrowings:
 *   get:
 *     summary: List borrowings
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [BORROWED, RETURNED, OVERDUE, LOST]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of borrowings
 */
router.get('/borrowings', validateQuery(queryBorrowingSchema), controller.getBorrowings);

/**
 * @swagger
 * /api/library/borrowings/{id}:
 *   get:
 *     summary: Get borrowing by ID
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Borrowing details
 */
router.get('/borrowings/:id', controller.getBorrowingById);

/**
 * @swagger
 * /api/library/borrowings:
 *   post:
 *     summary: Create borrowing
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookId
 *               - userId
 *             properties:
 *               bookId:
 *                 type: string
 *               userId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Borrowing created
 */
router.post(
  '/borrowings',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.createBorrowing
);

/**
 * @swagger
 * /api/library/borrowings/{id}/return:
 *   patch:
 *     summary: Return borrowed book
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               condition:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book returned
 */
router.patch(
  '/borrowings/:id/return',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.returnBook
);

/**
 * @swagger
 * /api/library/borrowings/{id}/lost:
 *   patch:
 *     summary: Mark book as lost
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Book marked as lost
 */
router.patch(
  '/borrowings/:id/lost',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  controller.markAsLost
);

// ==================== STATISTICS ====================

/**
 * @swagger
 * /api/library/stats/{unitId}:
 *   get:
 *     summary: Get library statistics for unit
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Library statistics (total books, borrowings, popular books)
 */
router.get(
  '/stats/:unitId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF),
  controller.getLibraryStats
);

export default router;
