import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import * as service from './wilayah.service';

// ==================== PROVINCES ====================

/** GET /api/wilayah/provinces */
export const listProvinces = asyncHandler(async (_req: Request, res: Response) => {
  const provinces = await service.listProvinces();
  res.json({ success: true, data: provinces });
});

/** GET /api/wilayah/provinces/:id */
export const getProvince = asyncHandler(async (req: Request, res: Response) => {
  const province = await service.getProvinceById(req.params.id);
  if (!province) {
    return res.status(404).json({ success: false, message: 'Province not found' });
  }
  res.json({ success: true, data: province });
});

/** POST /api/wilayah/provinces */
export const createProvince = asyncHandler(async (req: Request, res: Response) => {
  const { code, name } = req.body;
  const province = await service.createProvince({ code, name });
  res.status(201).json({ success: true, message: 'Province created', data: province });
});

// ==================== REGENCIES ====================

/** GET /api/wilayah/regencies */
export const listRegencies = asyncHandler(async (req: Request, res: Response) => {
  const { provinceId, search } = req.query;
  const regencies = await service.listRegencies({
    provinceId: provinceId as string | undefined,
    search: search as string | undefined,
  });
  res.json({ success: true, data: regencies });
});

/** GET /api/wilayah/regencies/:id */
export const getRegency = asyncHandler(async (req: Request, res: Response) => {
  const regency = await service.getRegencyById(req.params.id);
  if (!regency) {
    return res.status(404).json({ success: false, message: 'Regency not found' });
  }
  res.json({ success: true, data: regency });
});

/** POST /api/wilayah/regencies */
export const createRegency = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, provinceId } = req.body;
  const regency = await service.createRegency({ code, name, provinceId });
  res.status(201).json({ success: true, message: 'Regency created', data: regency });
});

// ==================== DISTRICTS ====================

/** GET /api/wilayah/districts */
export const listDistricts = asyncHandler(async (req: Request, res: Response) => {
  const { regencyId, search } = req.query;
  const districts = await service.listDistricts({
    regencyId: regencyId as string | undefined,
    search: search as string | undefined,
  });
  res.json({ success: true, data: districts });
});

/** GET /api/wilayah/districts/:id */
export const getDistrict = asyncHandler(async (req: Request, res: Response) => {
  const district = await service.getDistrictById(req.params.id);
  if (!district) {
    return res.status(404).json({ success: false, message: 'District not found' });
  }
  res.json({ success: true, data: district });
});

/** POST /api/wilayah/districts */
export const createDistrict = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, regencyId } = req.body;
  const district = await service.createDistrict({ code, name, regencyId });
  res.status(201).json({ success: true, message: 'District created', data: district });
});

// ==================== VILLAGES ====================

/** GET /api/wilayah/villages */
export const listVillages = asyncHandler(async (req: Request, res: Response) => {
  const { districtId, search, page = 1, limit = 50 } = req.query;
  const result = await service.listVillages({
    districtId: districtId as string | undefined,
    search: search as string | undefined,
    page: Number(page),
    limit: Number(limit),
  });
  res.json({ success: true, data: result.villages, pagination: result.pagination });
});

/** GET /api/wilayah/villages/:id */
export const getVillage = asyncHandler(async (req: Request, res: Response) => {
  const village = await service.getVillageById(req.params.id);
  if (!village) {
    return res.status(404).json({ success: false, message: 'Village not found' });
  }
  res.json({ success: true, data: village });
});

/** POST /api/wilayah/villages */
export const createVillage = asyncHandler(async (req: Request, res: Response) => {
  const { code, name, districtId, postalCode } = req.body;
  const village = await service.createVillage({ code, name, districtId, postalCode });
  res.status(201).json({ success: true, message: 'Village created', data: village });
});
