import { Router } from "express";
import * as controller from "./controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== CATEGORIES ====================

/**
 * @swagger
 * /api/inventory/categories:
 *   get:
 *     summary: List inventory categories
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get("/categories", controller.getCategories);

/**
 * @swagger
 * /api/inventory/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Inventory]
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
 *         description: Category details
 */
router.get("/categories/:id", controller.getCategoryById);

/**
 * @swagger
 * /api/inventory/categories:
 *   post:
 *     summary: Create category
 *     tags: [Inventory]
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
router.post("/categories", controller.createCategory);

/**
 * @swagger
 * /api/inventory/categories/{id}:
 *   put:
 *     summary: Update category
 *     tags: [Inventory]
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
router.put("/categories/:id", controller.updateCategory);

/**
 * @swagger
 * /api/inventory/categories/{id}:
 *   delete:
 *     summary: Delete category
 *     tags: [Inventory]
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
router.delete("/categories/:id", controller.deleteCategory);

// ==================== ITEMS ====================

/**
 * @swagger
 * /api/inventory/items:
 *   get:
 *     summary: List inventory items
 *     tags: [Inventory]
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
 *         name: lowStock
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
 *         description: List of items
 */
router.get("/items", controller.getItems);

/**
 * @swagger
 * /api/inventory/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Inventory]
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
 *         description: Item details
 */
router.get("/items/:id", controller.getItemById);

/**
 * @swagger
 * /api/inventory/items:
 *   post:
 *     summary: Add inventory item
 *     tags: [Inventory]
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
 *               - categoryId
 *               - unitId
 *             properties:
 *               name:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               unitId:
 *                 type: string
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               minStock:
 *                 type: integer
 *               location:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [NEW, GOOD, FAIR, POOR, DAMAGED]
 *     responses:
 *       201:
 *         description: Item created
 */
router.post("/items", controller.createItem);

/**
 * @swagger
 * /api/inventory/items/{id}:
 *   put:
 *     summary: Update item
 *     tags: [Inventory]
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
 *         description: Item updated
 */
router.put("/items/:id", controller.updateItem);

/**
 * @swagger
 * /api/inventory/items/{id}:
 *   delete:
 *     summary: Delete item
 *     tags: [Inventory]
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
 *         description: Item deleted
 */
router.delete("/items/:id", controller.deleteItem);

/**
 * @swagger
 * /api/inventory/maintenances/{id}/complete:
 *   post:
 *     summary: Complete maintenance and restore asset status
 *     tags: [Inventory]
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
 *         description: Maintenance completed
 */
router.post("/maintenances/:id/complete", controller.completeMaintenance);

// ==================== MAINTENANCE ====================

/**
 * @swagger
 * /api/inventory/maintenances:
 *   get:
 *     summary: List maintenance records
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
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
 *         description: List of maintenance records
 */
router.get("/maintenances", controller.getMaintenances);

/**
 * @swagger
 * /api/inventory/maintenances/{id}:
 *   get:
 *     summary: Get maintenance by ID
 *     tags: [Inventory]
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
 *         description: Maintenance details
 */
router.get("/maintenances/:id", controller.getMaintenanceById);

/**
 * @swagger
 * /api/inventory/maintenances:
 *   post:
 *     summary: Schedule maintenance
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *               - type
 *               - scheduledDate
 *             properties:
 *               itemId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [REPAIR, INSPECTION, CLEANING, REPLACEMENT]
 *               scheduledDate:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *     responses:
 *       201:
 *         description: Maintenance scheduled
 */
router.post("/maintenances", controller.createMaintenance);

/**
 * @swagger
 * /api/inventory/maintenances/{id}:
 *   put:
 *     summary: Update maintenance
 *     tags: [Inventory]
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
 *         description: Maintenance updated
 */
router.put("/maintenances/:id", controller.updateMaintenance);

/**
 * @swagger
 * /api/inventory/maintenances/{id}:
 *   delete:
 *     summary: Delete maintenance
 *     tags: [Inventory]
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
 *         description: Maintenance deleted
 */
router.delete("/maintenances/:id", controller.deleteMaintenance);

// ==================== STATISTICS ====================

/**
 * @swagger
 * /api/inventory/stats:
 *   get:
 *     summary: Get overall inventory statistics
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall inventory statistics
 */
router.get("/stats", controller.getInventoryStats);

/**
 * @swagger
 * /api/inventory/stats/{unitId}:
 *   get:
 *     summary: Get inventory statistics for unit
 *     tags: [Inventory]
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
 *         description: Unit inventory statistics
 */
router.get("/stats/:unitId", controller.getInventoryStats);

export default router;
