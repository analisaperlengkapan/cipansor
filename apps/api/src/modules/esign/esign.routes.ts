import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { EsignController } from './esign.controller';
import { authenticate, isSuperAdmin } from '@/middleware/auth';

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
import { validate } from '@/middleware/validate';
import {
  activateKeySchema,
  changePassphraseSchema,
  decideRequestSchema,
  requestKeySchema,
  revokeKeySchema,
  signLetterSchema,
} from './esign.schema';

const router = Router();

/**
 * Rute pembawa passphrase memakai jatah ketatnya sendiri.
 *
 * app.ts menyatakan tegas bahwa limiter ketat dipakai untuk "credential-bearing
 * endpoints ONLY", lalu mendaftar rute auth satu per satu. E-sign datang
 * belakangan dan tidak pernah ikut didaftarkan, sehingga penandatanganan,
 * pengaktifan kunci, dan penggantian passphrase berjalan dengan jatah biasa
 * 100/menit — padahal ketiganya membawa rahasia di dalam badan permintaan.
 *
 * Ini lapis kedua, bukan satu-satunya. Penguncian per-kunci (5 percobaan lalu
 * 15 menit) sudah membatasi penebakan terhadap satu akun, dan diperiksa
 * sebelum KDF dijalankan. Yang tidak dilihat penghitung per-kunci adalah satu
 * alamat yang mencoba menyisir BANYAK akun — itulah yang dibatasi di sini.
 *
 * Sengaja TIDAK dikenakan pada GET /me: itu status yang dibaca halaman
 * pengaturan setiap kali dibuka, dan membatasi pembacaan yang tidak menyimpan
 * apa pun untuk ditebak persis kekeliruan yang didokumentasikan app.ts tentang
 * /auth/me.
 *
 * Batasnya dapat diatur lewat env, sebagaimana twoFactorLimiter, agar e2e dan
 * dev bisa menaikkannya tanpa melonggarkan produksi.
 */
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

const publicVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.PUBLIC_VERIFY_RATE_LIMIT_MAX) || 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Terlalu banyak percobaan verifikasi dokumen. Coba lagi beberapa saat lagi.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Verifikasi publik — SENGAJA di luar `authenticate`.
 *
 * QR pada surat dipindai oleh pihak luar yang tidak punya akun di sini: dinas,
 * wali santri, calon mitra. Menaruhnya di balik login membuat fiturnya tidak
 * ada gunanya. Yang dijaga bukan aksesnya, melainkan apa yang dijawab — lihat
 * verifyByToken: tidak pernah mengembalikan isi surat.
 *
 * Didaftarkan sebelum `router.use(authenticate)` karena middleware Express
 * berlaku untuk rute yang didaftarkan sesudahnya.
 */
router.get('/verify/:token', publicVerifyLimiter, EsignController.verify);
router.post('/verify-pdf', publicVerifyLimiter, memoryUpload.single('file'), EsignController.verifyPdf);

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
  memoryUpload.single('file'),
  validate(signLetterSchema),
  EsignController.signLetter
);

// Kewenangan Super Admin: menyetujui, menolak, mencabut.
router.get('/requests', isSuperAdmin, EsignController.listRequests);
router.post('/requests/:id/decide', isSuperAdmin, validate(decideRequestSchema), EsignController.decide);
router.post('/keys/:userId/revoke', isSuperAdmin, validate(revokeKeySchema), EsignController.revoke);

export default router;
