import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RoleCode } from '@prisma/client';
import { validate } from '@/middleware/error';
import { authenticate, authorize } from '@/middleware/auth';
import { requireTurnstile } from '@/middleware/turnstile';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import * as controller from './chatbot.controller';
import { publicChatSchema, updatePersonaSchema } from './chatbot.schema';

/**
 * Dedicated limiter, much stricter than `defaultLimiter`.
 *
 * Every request here costs money upstream and is reachable by anyone on the
 * internet with no credential — the textbook shape of a cost-amplification
 * target. 10/minute per IP is generous for a human asking questions and
 * useless for anyone trying to run up a bill.
 */
const chatbotLimiter = rateLimit({
  windowMs: config.chatbot.rateLimit.windowMs,
  max: config.chatbot.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Terlalu banyak pertanyaan. Mohon tunggu sebentar sebelum bertanya lagi.',
    },
  },
  handler: (req, res, _next, options) => {
    logger.warn('Chatbot rate limit exceeded', { ip: req.ip });
    res.status(options.statusCode).json(options.message);
  },
});

const router = Router();

// No `authenticate`: this is the PUBLIC assistant. Anything requiring a user
// belongs to the Phase 2 authenticated agent, which must reach private data by
// calling existing authorised endpoints as that user with their active role —
// never by widening what this router can see.
router.get('/public/status', controller.status);
// Turnstile di depan limiter yang sudah ada, bukan menggantikannya. Batas
// 10/menit per IP membatasi ongkos satu penyerang; Turnstile membatasi jumlah
// penyerang yang sepadan untuk mencoba. Endpoint ini membelanjakan uang pada
// setiap panggilan, jadi keduanya dipakai bersama.
router.post(
  '/public/ask',
  chatbotLimiter,
  requireTurnstile,
  validate(publicChatSchema),
  controller.ask
);

// Admin surface: configure the assistant's persona. Authenticated and locked to
// SUPER_ADMIN — the persona is additive style only (it can never revoke a
// safety rule, see prompt.ts), but who may edit the public voice of the
// pesantren is still a privilege, not a public one.
router.get('/admin/persona', authenticate, authorize(RoleCode.SUPER_ADMIN), controller.getPersona);
router.put(
  '/admin/persona',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN),
  validate(updatePersonaSchema),
  controller.updatePersona
);
router.delete(
  '/admin/persona',
  authenticate,
  authorize(RoleCode.SUPER_ADMIN),
  controller.resetPersona
);

export default router;
