import { Request, Response, NextFunction } from 'express';
import { SigningKeyRequestStatus } from '@prisma/client';
import { EsignService } from './esign.service';
import { Errors } from '@/middleware/error';

export const EsignController = {
  async myStatus(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await EsignService.myStatus(req.user!.id) });
    } catch (e) { next(e); }
  },

  async requestKey(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EsignService.requestKey(req.user!.id, req.body?.reason);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EsignService.activateKey(req.user!.id, req.body.passphrase);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  async changePassphrase(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassphrase, accountPassword, newPassphrase } = req.body;
      const data = await EsignService.changePassphrase(
        req.user!.id, currentPassphrase, accountPassword, newPassphrase
      );
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  async listRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as SigningKeyRequestStatus | undefined;
      res.json({ success: true, data: await EsignService.listRequests(status) });
    } catch (e) { next(e); }
  },

  async decide(req: Request, res: Response, next: NextFunction) {
    try {
      const { approve, grantedDays, note } = req.body;
      const data = await EsignService.decideRequest(
        req.params.id, req.user!.id, approve, grantedDays, note
      );
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EsignService.revokeKey(req.params.userId, req.body.reason);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  async signLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await EsignService.signLetter(
        req.params.letterId, req.user!.id, req.body.passphrase
      );
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },

  /** Publik: dipanggil halaman verifikasi setelah QR dipindai. */
  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: await EsignService.verifyByToken(req.params.token) });
    } catch (e) { next(e); }
  },

  /** Publik: dipanggil halaman verifikasi publik via upload PDF. */
  async verifyPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const captchaAnswer = req.body?.captchaAnswer ?? req.body?.captcha;
      const expectedCaptcha = req.body?.expectedCaptcha ?? req.body?.captchaExpected;

      if (!captchaAnswer || !expectedCaptcha) {
        throw Errors.badRequest('Verifikasi CAPTCHA wajib diisi.');
      }

      if (String(captchaAnswer).trim() !== String(expectedCaptcha).trim()) {
        throw Errors.badRequest('Jawaban CAPTCHA tidak sesuai.');
      }

      if (!req.file || !req.file.buffer) {
        throw Errors.badRequest('File PDF wajib diunggah.');
      }

      const result = await EsignService.verifyByPdfBuffer(req.file.buffer);
      res.json({ success: true, data: result });
    } catch (e) {
      next(e);
    }
  },
};
