import { Request, Response, NextFunction } from 'express';
import { suppliersService } from './suppliers.service';
import { CreateSupplierInput, UpdateSupplierInput } from '@cipansor/shared';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string as string as string;
    const category = req.query.category as string as string as string;
    const isActive =
      req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const suppliers = await suppliersService.findAll(search, category, isActive);
    res.json({ data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supplier = await suppliersService.findById(id);
    res.json({ data: supplier });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateSupplierInput = req.body;
    const supplier = await suppliersService.create(input);
    res.status(201).json({ data: supplier });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const input: UpdateSupplierInput = req.body;
    const supplier = await suppliersService.update(id, input);
    res.json({ data: supplier });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await suppliersService.delete(id);
    res.json({ message: 'Supplier deleted (deactivated) successfully' });
  } catch (error) {
    next(error);
  }
};
