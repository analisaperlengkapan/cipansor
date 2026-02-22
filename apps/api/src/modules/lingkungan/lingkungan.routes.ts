import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as lingkunganController from './lingkungan.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF));

// Programs
router.get('/programs', lingkunganController.listPrograms);
router.post('/programs', lingkunganController.createProgram);
router.get('/programs/:id', lingkunganController.getProgram);
router.put('/programs/:id', lingkunganController.updateProgram);
router.delete('/programs/:id', lingkunganController.deleteProgram);

// Waste Management
router.get('/waste', lingkunganController.listWaste);
router.post('/waste', lingkunganController.createWaste);
router.get('/waste/summary', lingkunganController.getWasteSummary);

// Green Campus Indicators
router.get('/indicators', lingkunganController.listIndicators);
router.post('/indicators', lingkunganController.createIndicator);
router.put('/indicators/:id', lingkunganController.updateIndicator);
router.delete('/indicators/:id', lingkunganController.deleteIndicator);

export default router;
