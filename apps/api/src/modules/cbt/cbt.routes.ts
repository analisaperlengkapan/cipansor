import { Router } from 'express';
import { CBTController } from './cbt.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// --- Admin/Teacher Routes ---
// Bank Management
router.get(
  '/banks',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.getQuestionBanks
);
router.post(
  '/banks',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.createQuestionBank
);
router.get(
  '/banks/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.getQuestionBankById
);
router.delete(
  '/banks/:id',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.deleteQuestionBank
);

// Question Management
router.post(
  '/banks/:id/questions',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.addQuestion
);
router.put(
  '/banks/:id/questions/:questionId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.updateQuestion
);
router.delete(
  '/banks/:id/questions/:questionId',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  CBTController.deleteQuestion
);

// --- Student Routes ---
// Exam Taking
// Start Exam (examId is the ID of the scheduled Exam)
router.post('/exams/:examId/start', authenticate, authorize(UserRole.STUDENT), CBTController.startExam);

// Get Attempt Details (Questions, etc.)
router.get('/attempts/:attemptId', authenticate, authorize(UserRole.STUDENT), CBTController.getAttempt);

// Submit Answer
router.post(
  '/attempts/:attemptId/answer',
  authenticate,
  authorize(UserRole.STUDENT),
  CBTController.submitAnswer
);

// Finish Exam
router.post(
  '/attempts/:attemptId/finish',
  authenticate,
  authorize(UserRole.STUDENT),
  CBTController.finishExam
);

export const cbtRoutes = router;
