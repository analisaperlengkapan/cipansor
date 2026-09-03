import type { NextFunction, Request, Response } from 'express';
import { Errors } from '@/middleware/error';
import { logger } from '@/lib/logger';
import { readTurnstileToken, verifyTurnstileToken } from '@/utils/turnstile';

/**
 * Gerbang Turnstile untuk endpoint yang terbuka tanpa kredensial.
 *
 * **Urutannya penting dan tidak bisa ditukar: pasang SEBELUM `validate(...)`.**
 * `validate` menimpa `req.body` dengan hasil `schema.parse(...)`, dan skema
 * Zod di proyek ini membuang field yang tidak dikenalnya. Dipasang sesudahnya,
 * middleware ini akan mencari sebuah token yang baru saja dihapus dari
 * badan permintaan, lalu menolak setiap pengunjung yang sah dengan pesan
 * "token wajib disertakan". Uji di `turnstile.middleware.test.ts` memaku
 * urutan itu.
 *
 * Untuk rute multipart (`/esign/verify-pdf`), letaknya sesudah `upload.single`
 * dengan alasan yang sama dari arah sebaliknya: sebelum multer berjalan,
 * `req.body` masih kosong.
 *
 * Gerbang, bukan pengganti. Logika handler yang sudah ada tidak disentuh —
 * middleware ini hanya menentukan apakah handler itu dijalankan.
 */
export function requireTurnstile(req: Request, _res: Response, next: NextFunction): void {
  const token = readTurnstileToken(req.body);

  void verifyTurnstileToken(token, req.ip)
    .then((outcome) => {
      if (outcome.ok) {
        // Dicatat hanya ketika gerbangnya menyerah, bukan pada setiap
        // permintaan yang lolos: jalur bahagia di halaman masuk akan
        // menenggelamkan log, dan log yang tenggelam tidak dibaca siapa pun.
        if (outcome.reason === 'unreachable') {
          logger.warn('[Turnstile] permintaan diteruskan tanpa pemeriksaan', {
            path: req.path,
            ip: req.ip,
          });
        }
        next();
        return;
      }

      logger.warn('[Turnstile] permintaan ditolak', {
        path: req.path,
        ip: req.ip,
        reason: outcome.reason,
        codes: outcome.codes,
      });

      /**
       * Satu pesan untuk kedua kegagalan, dan itu disengaja.
       *
       * Membedakan "token tidak ada" dari "token ditolak" hanya berguna bagi
       * penulis skrip yang sedang mencari tahu sejauh mana tebakannya berhasil.
       * Bagi pengunjung sungguhan keduanya berarti hal yang sama, dan
       * tindakannya juga sama: muat ulang halaman, biarkan widget-nya selesai.
       */
      next(
        Errors.badRequest(
          'Verifikasi keamanan gagal. Silakan muat ulang halaman dan coba lagi.'
        )
      );
    })
    .catch((error) => next(error));
}
