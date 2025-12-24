import { Prisma, AssetStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
  CreateInventoryCategoryInput,
  UpdateInventoryCategoryInput,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  QueryInventoryItemInput,
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
  QueryMaintenanceInput,
} from "./schema";

// ==================== ASSET CATEGORY ====================

export async function getCategories() {
  return prisma.assetCategory.findMany({
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: string) {
  return prisma.assetCategory.findUnique({
    where: { id },
    include: {
      assets: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          condition: true,
        },
      },
      _count: { select: { assets: true } },
    },
  });
}

export async function createCategory(data: CreateInventoryCategoryInput) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.assetCategory.create({ data: data as any });
}

export async function updateCategory(id: string, data: UpdateInventoryCategoryInput) {
  return prisma.assetCategory.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.assetCategory.delete({ where: { id } });
}

// ==================== ASSET ====================

export async function getItems(query: QueryInventoryItemInput) {
  const { page, limit, unitId, categoryId, search, status, condition, location } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AssetWhereInput = {
    deletedAt: null,
    ...(unitId && { unitId }),
    ...(categoryId && { categoryId }),
    ...(status && { status }),
    ...(condition && { condition }),
    ...(location && { location: { contains: location, mode: "insensitive" } }),
    ...(search && {
      OR: [
        { code: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true } },
        _count: { select: { maintenanceLogs: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.count({ where }),
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

export async function getItemById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, code: true } },
      unit: { select: { id: true, name: true } },
      maintenanceLogs: {
        take: 5,
        orderBy: { maintenanceDate: "desc" },
      },
    },
  });
}

export async function createItem(data: CreateInventoryItemInput) {
  return prisma.asset.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      unitId: data.unitId,
      categoryId: data.categoryId,
      code: data.code,
      name: data.name,
      brand: data.brand,
      model: data.model,
      serialNumber: data.serialNumber,
      purchaseDate: data.purchaseDate,
      purchasePrice: data.purchasePrice,
      supplier: data.supplier,
      location: data.location,
      condition: data.condition,
      status: data.status,
      warrantyExpiry: data.warrantyExpiry,
      notes: data.notes,
      photoUrl: data.photoUrl,
    } as any,
    include: {
      category: { select: { id: true, name: true, code: true } },
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function updateItem(id: string, data: UpdateInventoryItemInput) {
  return prisma.asset.update({
    where: { id },
    data,
    include: {
      category: { select: { id: true, name: true, code: true } },
      unit: { select: { id: true, name: true } },
    },
  });
}

export async function deleteItem(id: string) {
  return prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// ==================== ASSET MAINTENANCE ====================

export async function getMaintenances(query: QueryMaintenanceInput) {
  const { page, limit, itemId, type, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AssetMaintenanceWhereInput = {
    ...(itemId && { assetId: itemId }),
    ...(type && { type: { contains: type, mode: "insensitive" } }),
    ...(startDate && endDate && {
      maintenanceDate: { gte: startDate, lte: endDate },
    }),
  };

  const [data, total] = await Promise.all([
    prisma.assetMaintenance.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: {
          select: {
            id: true,
            code: true,
            name: true,
            unit: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { maintenanceDate: "desc" },
    }),
    prisma.assetMaintenance.count({ where }),
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

export async function getMaintenanceById(id: string) {
  return prisma.assetMaintenance.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          id: true,
          code: true,
          name: true,
          category: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function createMaintenance(data: CreateMaintenanceInput) {
  // Update asset status to MAINTENANCE
  await prisma.asset.update({
    where: { id: data.itemId },
    data: { status: AssetStatus.MAINTENANCE },
  });

  return prisma.assetMaintenance.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      assetId: data.itemId,
      type: data.type,
      description: data.description,
      maintenanceDate: data.maintenanceDate,
      cost: data.cost,
      vendor: data.vendor,
      performedBy: data.performedBy,
      nextSchedule: data.nextSchedule,
      notes: data.notes,
    } as any,
    include: {
      asset: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function updateMaintenance(id: string, data: UpdateMaintenanceInput) {
  return prisma.assetMaintenance.update({
    where: { id },
    data,
    include: {
      asset: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function completeMaintenance(id: string) {
  const maintenance = await prisma.assetMaintenance.findUnique({ where: { id } });
  if (!maintenance) throw new Error("Maintenance record not found");

  // Restore asset status to ACTIVE
  await prisma.asset.update({
    where: { id: maintenance.assetId },
    data: { status: AssetStatus.ACTIVE },
  });

  return maintenance;
}

export async function deleteMaintenance(id: string) {
  return prisma.assetMaintenance.delete({ where: { id } });
}

// ==================== STATISTICS ====================

export async function getInventoryStats(unitId?: string) {
  const where: Prisma.AssetWhereInput = {
    deletedAt: null,
    ...(unitId && { unitId }),
  };

  const [
    totalItems,
    byStatus,
    byCondition,
    byCategory,
    recentMaintenances,
    totalValue,
  ] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.groupBy({
      by: ["status"],
      where,
      _count: true,
    }),
    prisma.asset.groupBy({
      by: ["condition"],
      where,
      _count: true,
    }),
    prisma.asset.groupBy({
      by: ["categoryId"],
      where,
      _count: true,
    }),
    prisma.assetMaintenance.count({
      where: {
        maintenanceDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        ...(unitId && { asset: { unitId } }),
      },
    }),
    prisma.asset.aggregate({
      where,
      _sum: { purchasePrice: true },
    }),
  ]);

  // Get category names for stats
  const categoryIds = byCategory.map((c) => c.categoryId);
  const categories = await prisma.assetCategory.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return {
    totalItems,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
    byCondition: byCondition.map((c) => ({ condition: c.condition, count: c._count })),
    byCategory: byCategory.map((c) => ({
      categoryId: c.categoryId,
      categoryName: categoryMap.get(c.categoryId) || "Unknown",
      count: c._count,
    })),
    recentMaintenances,
    totalValue: totalValue._sum.purchasePrice || 0,
  };
}
