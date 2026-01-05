import { Router } from "express";
import * as controller from "./controller";
import { authorize } from "../../middleware/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Categories (Static routes first)
router.get("/categories", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getCategories);
router.post("/categories", authorize(UserRole.ADMIN), controller.createCategory);
router.get("/categories/:id", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getCategoryById);
router.put("/categories/:id", authorize(UserRole.ADMIN), controller.updateCategory);
router.delete("/categories/:id", authorize(UserRole.ADMIN), controller.deleteCategory);

// Stats
router.get("/stats", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getInventoryStats);
router.get("/stats/:unitId", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getInventoryStats);

// Maintenance
router.get("/maintenance", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getMaintenances);
router.post("/maintenance", authorize(UserRole.ADMIN, UserRole.STAFF), controller.createMaintenance);
router.get("/maintenance/:id", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getMaintenanceById);
router.put("/maintenance/:id", authorize(UserRole.ADMIN, UserRole.STAFF), controller.updateMaintenance);
router.patch("/maintenance/:id/complete", authorize(UserRole.ADMIN, UserRole.STAFF), controller.completeMaintenance);
router.delete("/maintenance/:id", authorize(UserRole.ADMIN), controller.deleteMaintenance);

// Items
router.get("/", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getItems);
router.post("/", authorize(UserRole.ADMIN, UserRole.STAFF), controller.createItem);
router.get("/:id", authorize(UserRole.ADMIN, UserRole.TEACHER, UserRole.STAFF), controller.getItemById);
router.put("/:id", authorize(UserRole.ADMIN, UserRole.STAFF), controller.updateItem);
router.delete("/:id", authorize(UserRole.ADMIN), controller.deleteItem);

export default router;
