import { Router } from 'express';
import { emisController } from './emis.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Only admins can access EMIS export
const adminRoles = [UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN];

// Export endpoints
router.get('/export/students', authorize(...adminRoles), emisController.exportStudents);
router.get('/export/teachers', authorize(...adminRoles), emisController.exportTeachers);
router.get('/export/institution/:unitId', authorize(...adminRoles), emisController.exportInstitution);

// Summary and validation
router.get('/summary/:unitId', authorize(...adminRoles), emisController.getSummary);
router.get('/validate/:unitId', authorize(...adminRoles), emisController.validateData);

export default router;
