import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  createGuestBookSchema,
  updateGuestBookSchema,
  createStudentVisitSchema,
  updateStudentVisitSchema,
  createStudentPackageSchema,
  updateStudentPackageSchema
} from './reception.schema';
import * as ReceptionController from './reception.controller';

const router = Router();

router.use(authenticate);

// Stats
router.get('/stats', ReceptionController.getStats);

// Guest Book
router.get('/guests', ReceptionController.getGuestBooks);
router.post('/guests', validate(createGuestBookSchema), ReceptionController.createGuestBook);
router.patch('/guests/:id', validate(updateGuestBookSchema), ReceptionController.updateGuestBook);

// Student Visits
router.get('/visits', ReceptionController.getStudentVisits);
router.post('/visits', validate(createStudentVisitSchema), ReceptionController.createStudentVisit);
router.patch('/visits/:id', validate(updateStudentVisitSchema), ReceptionController.updateStudentVisit);

// Packages
router.get('/packages', ReceptionController.getPackages);
router.post('/packages', validate(createStudentPackageSchema), ReceptionController.createPackage);
router.patch('/packages/:id', validate(updateStudentPackageSchema), ReceptionController.updatePackage);

export default router;
