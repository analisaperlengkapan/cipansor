import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as perencanaanController from './perencanaan.controller';

const router = Router();

router.use(authenticate);
router.use(
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.UNIT_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF
  )
);

// Strategic Plans
router.get('/', perencanaanController.listPlans);
router.post('/', perencanaanController.createPlan);
router.get('/:id', perencanaanController.getPlan);
router.put('/:id', perencanaanController.updatePlan);
router.post('/:id/approve', perencanaanController.approvePlan);
router.delete('/:id', perencanaanController.deletePlan);

// Collaboration
router.post('/:id/collaborators', perencanaanController.addCollaborator);
router.delete('/:id/collaborators/:userId', perencanaanController.removeCollaborator);

// Objectives
router.post('/objectives', perencanaanController.createObjective);
router.put('/objectives/:id', perencanaanController.updateObjective);
router.delete('/objectives/:id', perencanaanController.deleteObjective);

// Indicators
router.post('/indicators', perencanaanController.createIndicator);
router.put('/indicators/:id', perencanaanController.updateIndicator);
router.delete('/indicators/:id', perencanaanController.deleteIndicator);

// Activities
router.post('/activities', perencanaanController.createActivity);
router.put('/activities/:id', perencanaanController.updateActivity);
router.delete('/activities/:id', perencanaanController.deleteActivity);

export default router;
