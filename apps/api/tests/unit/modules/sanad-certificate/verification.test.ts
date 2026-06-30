import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifyCertificate } from '../../../../src/modules/sanad-certificate/sanad-certificate.service';
import { prisma } from '../../../../src/lib/prisma';

vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    sanadRecord: { findFirst: vi.fn() },
  },
}));

describe('Sanad Certificate Service - Verification', () => {
  it('should verify simulated SANAD- numbers', async () => {
    const result = await verifyCertificate({ certificateNumber: 'SANAD-2025-TEST' });
    expect(result.valid).toBe(true);
  });
});
