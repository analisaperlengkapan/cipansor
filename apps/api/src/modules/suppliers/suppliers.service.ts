import { prisma } from '@/lib/prisma';
import { CreateSupplierInput, UpdateSupplierInput, Supplier } from '@cipansor/shared';
import { Errors } from '@/middleware/error';

export const suppliersService = {
  findAll: async (search?: string, category?: string, isActive?: boolean) => {
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    return suppliers as unknown as Supplier[];
  },

  findById: async (id: string) => {
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) throw Errors.notFound('Supplier');
    return supplier as unknown as Supplier;
  },

  create: async (data: CreateSupplierInput) => {
    const supplier = await prisma.supplier.create({
      data: {
        ...data,
        isActive: true
      }
    });
    return supplier as unknown as Supplier;
  },

  update: async (id: string, data: UpdateSupplierInput) => {
    const exists = await prisma.supplier.findUnique({ where: { id } });
    if (!exists) throw Errors.notFound('Supplier');

    const supplier = await prisma.supplier.update({
      where: { id },
      data
    });
    return supplier as unknown as Supplier;
  },

  delete: async (id: string) => {
    // Soft delete by setting isActive to false
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    });
    return supplier as unknown as Supplier;
  }
};
