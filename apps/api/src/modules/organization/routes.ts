import { Router } from 'express';
import { departmentController } from './departments/departments.controller';
import { positionController } from './positions/positions.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Department Routes
router.get('/departments', departmentController.findAll);
router.get('/departments/tree', departmentController.getTree);
router.get('/departments/:id', departmentController.findOne);
router.post('/departments', departmentController.create);
router.patch('/departments/:id', departmentController.update);
router.delete('/departments/:id', departmentController.delete);

// Position Routes
router.get('/positions', positionController.findAll);
router.get('/positions/tree', positionController.getTree);
router.get('/positions/:id', positionController.findOne);
router.post('/positions', positionController.create);
router.patch('/positions/:id', positionController.update);
router.delete('/positions/:id', positionController.delete);

export const organizationRoutes = router;
