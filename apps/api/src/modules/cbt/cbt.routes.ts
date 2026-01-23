import { Router } from 'express';
import { CBTController } from './cbt.controller';
import { authenticate, authorize } from '@/middleware/auth';

const router = Router();

// --- Admin/Teacher Routes ---
// Bank Management
router.get(
  '/banks',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.getQuestionBanks
);
router.post(
  '/banks',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.createQuestionBank
);
router.get(
  '/banks/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.getQuestionBankById
);
router.delete(
  '/banks/:id',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.deleteQuestionBank
);

// Question Management
router.post(
  '/banks/:id/questions',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.addQuestion
);
router.put(
  '/banks/:id/questions/:questionId',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.updateQuestion
);
router.delete(
  '/banks/:id/questions/:questionId',
  authenticate,
  authorize(['SUPER_ADMIN', 'UNIT_ADMIN', 'TEACHER']),
  CBTController.deleteQuestion
);

// --- Student Routes ---
// Exam Taking
// Start Exam (examId is the ID of the scheduled Exam)
router.post('/exams/:examId/start', authenticate, authorize(['STUDENT']), CBTController.startExam);

// Get Attempt Details (Questions, etc.)
router.get('/attempts/:attemptId', authenticate, authorize(['STUDENT']), CBTController.getAttempt);

// Submit Answer
router.post(
  '/attempts/:attemptId/answer',
  authenticate,
  authorize(['STUDENT']),
  CBTController.submitAnswer
);

// Finish Exam
router.post(
  '/attempts/:attemptId/finish',
  authenticate,
  authorize(['STUDENT']),
  CBTController.finishExam
);

export const cbtRoutes = router;
