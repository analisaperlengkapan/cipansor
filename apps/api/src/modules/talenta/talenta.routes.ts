import { Router } from 'express';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';
import * as talentaController from './talenta.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.STAFF));

// Talent Profiles
router.get('/analytics', talentaController.getTalentAnalytics);
router.get('/competency-gap/:userId', talentaController.getCompetencyGap);
router.get('/profiles', talentaController.listProfiles);
router.post('/profiles', talentaController.createProfile);
router.get('/profiles/:id', talentaController.getProfile);
router.put('/profiles/:id', talentaController.updateProfile);
router.delete('/profiles/:id', talentaController.deleteProfile);

// Assessments
router.post('/assessments', talentaController.createAssessment);

// Training Programs
router.get('/trainings', talentaController.listTrainings);
router.post('/trainings', talentaController.createTraining);
router.get('/trainings/:id', talentaController.getTraining);
router.put('/trainings/:id', talentaController.updateTraining);
router.delete('/trainings/:id', talentaController.deleteTraining);
router.post('/trainings/enroll', talentaController.enrollTraining);

// Succession Planning
router.get('/successions', talentaController.listSuccessions);
router.get('/successions/suggest', talentaController.suggestSuccessors);
router.post('/successions', talentaController.createSuccession);
router.put('/successions/:id', talentaController.updateSuccession);
router.delete('/successions/:id', talentaController.deleteSuccession);

export default router;
