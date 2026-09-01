import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { EsignController } from './esign.controller';
import { authenticate, isSuperAdmin } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import { Errors } from '@/middleware/error';
import {
  activateKeySchema,
  changePassphraseSchema,
  decideRequestSchema,
  requestKeySchema,
  revokeKeySchema,
  signLetterSchema,
} from './esign.schema';

const router = Router();

const passphraseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.ESIGN_RATE_LIMIT_MAX) || 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message:
        'Terlalu banyak percobaan tanda tangan elektronik. Coba lagi beberapa saat lagi.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter publik khusus verifikasi dokumen.
 */
const publicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PUBLIC_VERIFY_RATE_LIMIT_MAX) || 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Terlalu banyak permintaan verifikasi dokumen. Coba lagi beberapa saat lagi.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Multer memory storage untuk mengunggah file PDF sementara.
 * File tidak disimpan di disk dan dibuang dari memori setelah endpoint merespons.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimal 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(Errors.badRequest('File yang diunggah harus berformat PDF.'));
    }
  },
});

/**
 * Verifikasi publik — SENGAJA di luar `authenticate`.
 *
 * Didaftarkan sebelum `router.use(authenticate)`.
 */
router.get('/verify/:token', publicVerifyLimiter, EsignController.verify);
router.post('/verify-pdf', publicVerifyLimiter, upload.single('file'), EsignController.verifyPdf);

router.use(authenticate);

// Milik sendiri, di halaman pengaturan.
router.get('/me', EsignController.myStatus);
router.post('/me/request', validate(requestKeySchema), EsignController.requestKey);
router.post(
  '/me/activate',
  passphraseLimiter,
  validate(activateKeySchema),
  EsignController.activate
);
router.post(
  '/me/passphrase',
  passphraseLimiter,
  validate(changePassphraseSchema),
  EsignController.changePassphrase
);

// Menandatangani surat.
router.post(
  '/letters/:letterId/sign',
  passphraseLimiter,
  validate(signLetterSchema),
  EsignController.signLetter
);

// Kewenangan Super Admin: menyetujui, menolak, mencabut.
router.get('/requests', isSuperAdmin, EsignController.listRequests);
router.post('/requests/:id/decide', isSuperAdmin, validate(decideRequestSchema), EsignController.decide);
router.post('/keys/:userId/revoke', isSuperAdmin, validate(revokeKeySchema), EsignController.revoke);

export default router;
