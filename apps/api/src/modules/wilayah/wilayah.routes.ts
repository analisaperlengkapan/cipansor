import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as controller from './wilayah.controller';

const router = Router();

// ==================== PUBLIC LOOKUPS ====================
// Geographic reference data is read without auth (used by registration forms).
router.get('/provinces', controller.listProvinces);
router.get('/provinces/:id', controller.getProvince);
router.get('/regencies', controller.listRegencies);
router.get('/regencies/:id', controller.getRegency);
router.get('/districts', controller.listDistricts);
router.get('/districts/:id', controller.getDistrict);
router.get('/villages', controller.listVillages);
router.get('/villages/:id', controller.getVillage);

// ==================== ADMIN ROUTES ====================
// Everything below requires authentication + super-admin.
router.use(authenticate);

router.post('/provinces', authorize(UserRole.SUPER_ADMIN), controller.createProvince);
router.post('/regencies', authorize(UserRole.SUPER_ADMIN), controller.createRegency);
router.post('/districts', authorize(UserRole.SUPER_ADMIN), controller.createDistrict);
router.post('/villages', authorize(UserRole.SUPER_ADMIN), controller.createVillage);

export default router;
