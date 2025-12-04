import type { Request, Response, NextFunction } from "express";
import * as service from "./service";
import {
  createInventoryCategorySchema,
  updateInventoryCategorySchema,
  createInventoryItemSchema,
  updateInventoryItemSchema,
  queryInventoryItemSchema,
  createMaintenanceSchema,
  updateMaintenanceSchema,
  queryMaintenanceSchema,
} from "./schema";
import { Errors } from "../../middleware/error";

// ==================== INVENTORY CATEGORY ====================

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await service.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryById(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await service.getCategoryById(req.params.id);
    if (!category) {
      throw Errors.notFound("Category not found");
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createInventoryCategorySchema.parse(req.body);
    const category = await service.createCategory(data);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateInventoryCategorySchema.parse(req.body);
    const category = await service.updateCategory(req.params.id, data);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteCategory(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    next(error);
  }
}

// ==================== INVENTORY ITEM ====================

export async function getItems(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryInventoryItemSchema.parse(req.query);
    const result = await service.getItems(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getItemById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await service.getItemById(req.params.id);
    if (!item) {
      throw Errors.notFound("Item not found");
    }
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createInventoryItemSchema.parse(req.body);
    const item = await service.createItem(data);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateInventoryItemSchema.parse(req.body);
    const item = await service.updateItem(req.params.id, data);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteItem(req.params.id);
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    next(error);
  }
}

export async function completeMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const maintenance = await service.completeMaintenance(req.params.id);
    res.json({ success: true, data: maintenance, message: "Maintenance completed, asset status restored" });
  } catch (error) {
    next(error);
  }
}

// ==================== MAINTENANCE ====================

export async function getMaintenances(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryMaintenanceSchema.parse(req.query);
    const result = await service.getMaintenances(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getMaintenanceById(req: Request, res: Response, next: NextFunction) {
  try {
    const maintenance = await service.getMaintenanceById(req.params.id);
    if (!maintenance) {
      throw Errors.notFound("Maintenance record not found");
    }
    res.json({ success: true, data: maintenance });
  } catch (error) {
    next(error);
  }
}

export async function createMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMaintenanceSchema.parse(req.body);
    const maintenance = await service.createMaintenance(data);
    res.status(201).json({ success: true, data: maintenance });
  } catch (error) {
    next(error);
  }
}

export async function updateMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMaintenanceSchema.parse(req.body);
    const maintenance = await service.updateMaintenance(req.params.id, data);
    res.json({ success: true, data: maintenance });
  } catch (error) {
    next(error);
  }
}

export async function deleteMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteMaintenance(req.params.id);
    res.json({ success: true, message: "Maintenance record deleted" });
  } catch (error) {
    next(error);
  }
}

// ==================== STATISTICS ====================

export async function getInventoryStats(req: Request, res: Response, next: NextFunction) {
  try {
    const unitId = req.params.unitId;
    const stats = await service.getInventoryStats(unitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
