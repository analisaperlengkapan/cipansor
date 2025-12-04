import { Router } from 'express';
import { counselingController } from './counseling.controller';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ======================
// SESSION ROUTES
// ======================

// Get my sessions (counselor)
router.get(
  '/my-sessions',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.getMySessions.bind(counselingController)
);

// Get statistics
router.get(
  '/statistics',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN),
  counselingController.getStatistics.bind(counselingController)
);

// Get student counseling history
router.get(
  '/students/:studentId/history',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER, UserRole.PARENT),
  counselingController.getStudentHistory.bind(counselingController)
);

// List all sessions
router.get(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.getSessions.bind(counselingController)
);

// Get session by ID
router.get(
  '/:sessionId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.getSessionById.bind(counselingController)
);

// Create session
router.post(
  '/',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.createSession.bind(counselingController)
);

// Update session
router.put(
  '/:sessionId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.updateSession.bind(counselingController)
);

// Delete session
router.delete(
  '/:sessionId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.deleteSession.bind(counselingController)
);

// ======================
// NOTES ROUTES
// ======================

// Add note to session
router.post(
  '/:sessionId/notes',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.addNote.bind(counselingController)
);

// Update note
router.put(
  '/notes/:noteId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.updateNote.bind(counselingController)
);

// Delete note
router.delete(
  '/notes/:noteId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.deleteNote.bind(counselingController)
);

// ======================
// REFERRAL ROUTES
// ======================

// Add referral to session
router.post(
  '/:sessionId/referrals',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.addReferral.bind(counselingController)
);

// Update referral
router.put(
  '/referrals/:referralId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.updateReferral.bind(counselingController)
);

// Delete referral
router.delete(
  '/referrals/:referralId',
  authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.TEACHER),
  counselingController.deleteReferral.bind(counselingController)
);

export default router;
