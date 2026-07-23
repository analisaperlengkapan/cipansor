import { Router } from 'express';
import { EsignController } from './esign.controller';
import { authenticate, isSuperAdmin } from '@/middleware/auth';
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
router.get('/verify/:token', EsignController.verify);

router.use(authenticate);

// Milik sendiri, di halaman pengaturan.
router.get('/me', EsignController.myStatus);
router.post('/me/request', validate(requestKeySchema), EsignController.requestKey);
router.post('/me/activate', validate(activateKeySchema), EsignController.activate);
router.post(
  '/me/passphrase',
  validate(changePassphraseSchema),
  EsignController.changePassphrase
);

// Menandatangani surat.
router.post(
  '/letters/:letterId/sign',
  validate(signLetterSchema),
  EsignController.signLetter
);

// Kewenangan Super Admin: menyetujui, menolak, mencabut.
router.get('/requests', isSuperAdmin, EsignController.listRequests);
router.post('/requests/:id/decide', isSuperAdmin, validate(decideRequestSchema), EsignController.decide);
router.post('/keys/:userId/revoke', isSuperAdmin, validate(revokeKeySchema), EsignController.revoke);

export default router;
