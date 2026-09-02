import crypto from 'crypto';

const CAPTCHA_SECRET = process.env.JWT_SECRET || 'cipansor-captcha-secret-key-2025';
const CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface CaptchaChallenge {
  token: string;
  num1: number;
  num2: number;
}

export function generateCaptchaChallenge(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const answer = num1 + num2;
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;

  const payload = `${num1}:${num2}:${answer}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
  const token = `${Buffer.from(payload).toString('base64url')}.${hmac}`;

  return { token, num1, num2 };
}

export function verifyCaptchaAnswer(token: string | undefined | null, answerStr: string | undefined | null): boolean {
  if (!token || !answerStr) return false;

  try {
    const [payloadB64, hmac] = token.split('.');
    if (!payloadB64 || !hmac) return false;

    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expectedHmac = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return false;
    }

    const [num1Str, num2Str, expectedAnswerStr, expiresAtStr] = payload.split(':');
    const expiresAt = Number(expiresAtStr);

    if (Date.now() > expiresAt) {
      return false; // Expired
    }

    return Number(answerStr) === Number(expectedAnswerStr);
  } catch {
    return false;
  }
}
