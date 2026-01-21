import QRCode from 'qrcode';
import { createNotification } from '../notifications/service';
import {
  Prisma,
  AssetStatus,
  AssetCondition,
  AssetMaintenanceStatus,
  NotificationType,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { createNotification } from '../notifications/service';
import type {
  CreateInventoryCategoryInput,
  UpdateInventoryCategoryInput,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  QueryInventoryItemInput,
  CreateMaintenanceInput,
  CreateMaintenanceRequestInput,
  UpdateMaintenanceInput,
  UpdateMaintenanceStatusInput,
  QueryMaintenanceInput,
  CreateAssetAssignmentInput,
  CreateAssetDisposalInput,
  ReturnAssetAssignmentInput,
  QueryAssetAssignmentInput,
  CreateAssetAuditInput,
  QueryAssetAuditInput,
  UpdateAssetAuditItemInput,
} from './schema';

export async function getQrCode(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
  });

  if (!asset) throw new Error('Asset not found');

  // Format: "CODE - NAME" or a deep link if preferred
  // For now, let's use a URL to the frontend detail page
  // Assumption: Frontend URL is accessible via generic means or just encoding the ID
  // Let's encode a JSON object or just the URL. A URL is "Best Practice" for scanning.
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const url = `${appUrl}/inventory/${id}`;

  return QRCode.toDataURL(url);
}

// ==================== ASSET CATEGORY ====================

export async function getCategories() {
  return prisma.assetCategory.findMany({
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryById(id: string) {
  return prisma.assetCategory.findUnique({
    where: { id },
    include: {
      assets: {
        take: 10,
        orderBy: { createdAt: 'desc' },
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
    ...(location && { location: { contains: location, mode: 'insensitive' } }),
    ...(search && {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
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
        room: { select: { id: true, name: true } },
        _count: { select: { maintenanceLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
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
      room: { select: { id: true, name: true } },
      maintenanceLogs: {
        take: 5,
        orderBy: { maintenanceDate: 'desc' },
      },
      assignments: {
        take: 5,
        orderBy: { assignedAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createItem(data: CreateInventoryItemInput) {
  return prisma.asset.create({
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
      roomId: data.roomId,
      purchaseOrderNo: data.purchaseOrderNo,
      usefulLife: data.usefulLife,
      residualValue: data.residualValue,
      condition: data.condition,
      status: data.status,
      warrantyExpiry: data.warrantyExpiry,
      notes: data.notes,
      photoUrl: data.photoUrl,
    },
    include: {
      category: { select: { id: true, name: true, code: true } },
      unit: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
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
      room: { select: { id: true, name: true } },
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
  const { page, limit, itemId, type, status, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AssetMaintenanceWhereInput = {
    ...(itemId && { assetId: itemId }),
    ...(status && { status }),
    ...(type && { type: { contains: type, mode: 'insensitive' } }),
    ...(startDate &&
      endDate && {
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
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { maintenanceDate: 'desc' },
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
      requestedBy: { select: { id: true, name: true } },
    },
  });
}

// Admin/Staff direct creation
export async function createMaintenance(data: CreateMaintenanceInput) {
  // Update asset status to MAINTENANCE
  await prisma.asset.update({
    where: { id: data.itemId },
    data: { status: AssetStatus.MAINTENANCE },
  });

  return prisma.assetMaintenance.create({
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
      status: AssetMaintenanceStatus.IN_PROGRESS,
    },
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

// User request
export async function createMaintenanceRequest(
  data: CreateMaintenanceRequestInput,
  userId: string
) {
  const asset = await prisma.asset.findUnique({
    where: { id: data.assetId },
    select: { id: true, code: true, name: true, unitId: true },
  });

  if (!asset) throw new Error('Asset not found');

  const maintenance = await prisma.assetMaintenance.create({
    data: {
      assetId: data.assetId,
      type: data.type,
      description: data.description,
      notes: data.notes,
      maintenanceDate: new Date(),
      status: AssetMaintenanceStatus.PENDING,
      requestedById: userId,
      performedBy: 'Pending Assignment',
    },
  });

  // Notify Unit Admins
  const admins = await prisma.user.findMany({
    where: {
      unitId: asset.unitId,
      role: 'UNIT_ADMIN',
      isActive: true,
    },
    select: { id: true },
  });

  // Send notifications asynchronously
  Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: NotificationType.ALERT,
        title: 'Permintaan Maintenance Baru',
        message: `Permintaan maintenance untuk aset ${asset.code} - ${asset.name}: ${data.description}`,
        link: `/inventory/${asset.id}?tab=maintenance`,
        priority: 1, // High priority
        channels: ['APP'],
        recipientType: 'UNIT_ADMIN',
      })
    )
  ).catch((err) => console.error('Failed to send maintenance notifications', err));

  return maintenance;
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

export async function updateMaintenanceStatus(id: string, data: UpdateMaintenanceStatusInput) {
  const maintenance = await prisma.assetMaintenance.findUnique({ where: { id } });
  if (!maintenance) throw new Error('Maintenance record not found');

  const updateData: Prisma.AssetMaintenanceUpdateInput = {
    status: data.status,
    notes: data.notes
      ? maintenance.notes
        ? `${maintenance.notes}\n${data.notes}`
        : data.notes
      : undefined,
    cost: data.cost,
    completionDate: data.completionDate,
    invoiceUrl: data.invoiceUrl,
  };

  // If completing, fix asset status
  if (data.status === AssetMaintenanceStatus.COMPLETED) {
    await prisma.asset.update({
      where: { id: maintenance.assetId },
      data: { status: AssetStatus.ACTIVE },
    });
    // Ensure completion date is set
    if (!updateData.completionDate) {
      updateData.completionDate = new Date();
    }
  } else if (data.status === AssetMaintenanceStatus.IN_PROGRESS) {
    await prisma.asset.update({
      where: { id: maintenance.assetId },
      data: { status: AssetStatus.MAINTENANCE },
    });
  }

  return prisma.assetMaintenance.update({
    where: { id },
    data: updateData,
    include: {
      asset: true,
    },
  });
}

export async function completeMaintenance(id: string) {
  return updateMaintenanceStatus(id, { status: AssetMaintenanceStatus.COMPLETED });
}

export async function deleteMaintenance(id: string) {
  return prisma.assetMaintenance.delete({ where: { id } });
}

// ==================== ASSET DISPOSAL ====================

export async function disposeAsset(
  assetId: string,
  data: CreateAssetDisposalInput,
  userId: string
) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');
  if (asset.status === AssetStatus.DISPOSED) throw new Error('Asset is already disposed');

  // Calculate book value at disposal
  const depreciation = await calculateDepreciation(assetId);
  const bookValue = depreciation?.bookValue ?? 0;

  return prisma.$transaction([
    prisma.asset.update({
      where: { id: assetId },
      data: { status: AssetStatus.DISPOSED, deletedAt: new Date() },
    }),
    prisma.assetDisposal.create({
      data: {
        assetId,
        date: data.date,
        reason: data.reason,
        salePrice: data.salePrice,
        bookValue,
        notes: data.notes,
        approvedById: userId,
      },
    }),
  ]);
}

// ==================== ASSET ASSIGNMENT ====================

export async function createAssignment(data: CreateAssetAssignmentInput) {
  // Verify asset is available
  const asset = await prisma.asset.findUnique({
    where: { id: data.assetId },
  });

  if (!asset) throw new Error('Asset not found');
  if (asset.status !== AssetStatus.ACTIVE) throw new Error('Asset is not available for assignment');

  // Check if asset is already assigned
  const activeAssignment = await prisma.assetAssignment.findFirst({
    where: {
      assetId: data.assetId,
      status: 'ACTIVE',
    },
  });

  if (activeAssignment) throw new Error('Asset is currently assigned to another user');

  return prisma.assetAssignment.create({
    data: {
      assetId: data.assetId,
      userId: data.userId,
      assignedAt: data.assignedAt,
      dueDate: data.dueDate,
      conditionBefore: data.conditionBefore,
      notes: data.notes,
      status: 'ACTIVE',
    },
    include: {
      asset: true,
      user: { select: { id: true, name: true } },
    },
  });
}

export async function returnAssignment(id: string, data: ReturnAssetAssignmentInput) {
  const assignment = await prisma.assetAssignment.findUnique({
    where: { id },
  });

  if (!assignment) throw new Error('Assignment not found');
  if (assignment.status !== 'ACTIVE') throw new Error('Assignment is already returned');

  // Update assignment status and asset condition
  const [, updatedAssignment] = await prisma.$transaction([
    prisma.asset.update({
      where: { id: assignment.assetId },
      data: { condition: data.conditionAfter },
    }),
    prisma.assetAssignment.update({
      where: { id },
      data: {
        returnedAt: data.returnedAt,
        conditionAfter: data.conditionAfter,
        notes: data.notes
          ? `${assignment.notes || ''}\nReturn Notes: ${data.notes}`
          : assignment.notes,
        status: 'RETURNED',
      },
      include: {
        asset: true,
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return updatedAssignment;
}

export async function getAssignments(query: QueryAssetAssignmentInput) {
  const { page, limit, assetId, userId, status } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AssetAssignmentWhereInput = {
    ...(assetId && { assetId }),
    ...(userId && { userId }),
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.assetAssignment.findMany({
      where,
      skip,
      take: limit,
      include: {
        asset: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { assignedAt: 'desc' },
    }),
    prisma.assetAssignment.count({ where }),
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

// ==================== ASSET AUDIT ====================

export async function createAudit(data: CreateAssetAuditInput, createdById: string) {
  // Create audit and populate items
  const assets = await prisma.asset.findMany({
    where: { unitId: data.unitId, deletedAt: null },
  });

  return prisma.assetAudit.create({
    data: {
      unitId: data.unitId,
      date: data.date,
      notes: data.notes,
      createdById,
      status: 'PLANNED',
      items: {
        create: assets.map((asset) => ({
          assetId: asset.id,
          systemStatus: asset.status,
          actualStatus: 'UNKNOWN', // To be filled during audit
          condition: asset.condition,
          isMatch: true, // Default assume match until checked
        })),
      },
    },
  });
}

export async function getAudits(query: QueryAssetAuditInput) {
  const { page, limit, unitId, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.AssetAuditWhereInput = {
    ...(unitId && { unitId }),
    ...(startDate && endDate && { date: { gte: startDate, lte: endDate } }),
  };

  const [data, total] = await Promise.all([
    prisma.assetAudit.findMany({
      where,
      skip,
      take: limit,
      include: {
        unit: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.assetAudit.count({ where }),
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

export async function getAuditById(id: string) {
  return prisma.assetAudit.findUnique({
    where: { id },
    include: {
      unit: { select: { name: true } },
      createdBy: { select: { name: true } },
      items: {
        include: {
          asset: {
            select: { code: true, name: true, location: true, room: { select: { name: true } } },
          },
        },
        orderBy: { asset: { code: 'asc' } },
      },
    },
  });
}

export async function updateAuditItem(id: string, data: UpdateAssetAuditItemInput) {
  return prisma.assetAuditItem.update({
    where: { id },
    data,
  });
}

export async function completeAudit(id: string) {
  return prisma.assetAudit.update({
    where: { id },
    data: { status: 'COMPLETED' },
  });
}

// ==================== DEPRECIATION ====================

export async function calculateDepreciation(assetId: string) {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset || !asset.purchasePrice || !asset.purchaseDate || !asset.usefulLife) {
    return null;
  }

  const cost = Number(asset.purchasePrice);
  const residual = Number(asset.residualValue || 0);
  const lifeMonths = asset.usefulLife;
  const monthlyDepreciation = (cost - residual) / lifeMonths;

  const ageMonths =
    (new Date().getFullYear() - asset.purchaseDate.getFullYear()) * 12 +
    (new Date().getMonth() - asset.purchaseDate.getMonth());

  const accumulatedDepreciation = Math.min(
    monthlyDepreciation * Math.max(0, ageMonths),
    cost - residual
  );
  const bookValue = Math.max(cost - accumulatedDepreciation, residual);

  return {
    cost,
    residual,
    lifeMonths,
    ageMonths,
    monthlyDepreciation,
    accumulatedDepreciation,
    bookValue,
  };
}

// ==================== STATISTICS ====================

export async function getInventoryStats(unitId?: string) {
  const where: Prisma.AssetWhereInput = {
    deletedAt: null,
    ...(unitId && { unitId }),
  };

  const [totalItems, byStatus, byCondition, byCategory, recentMaintenances, totalValue] =
    await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.asset.groupBy({
        by: ['condition'],
        where,
        _count: true,
      }),
      prisma.asset.groupBy({
        by: ['categoryId'],
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
      categoryName: categoryMap.get(c.categoryId) || 'Unknown',
      count: c._count,
    })),
    recentMaintenances,
    totalValue: totalValue._sum.purchasePrice ? Number(totalValue._sum.purchasePrice) : 0,
  };
}
