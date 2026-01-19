import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      purchaseRequest: {
        findFirst: vi.fn(),
      },
      asset: {
        findFirst: vi.fn(),
      },
    },
  };
});

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { generateUniqueCode } from '@/utils/code-generator';

describe('generateUniqueCode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Use fake timers to ensure consistent date in tests
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-10-15'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should generate correct code for assets when no previous record exists', async () => {
        mockPrisma.asset.findFirst.mockResolvedValue(null);

        const code = await generateUniqueCode('AST', 'assets');

        // Expected: AST-202410-0001
        expect(code).toBe('AST-202410-0001');
        expect(mockPrisma.asset.findFirst).toHaveBeenCalledWith({
            where: { code: { startsWith: 'AST-202410-' } },
            orderBy: { code: 'desc' },
            select: { code: true }
        });
    });

    it('should generate correct code for assets when previous record exists', async () => {
        mockPrisma.asset.findFirst.mockResolvedValue({ code: 'AST-202410-0042' });

        const code = await generateUniqueCode('AST', 'assets');

        // Expected: AST-202410-0043
        expect(code).toBe('AST-202410-0043');
    });

    it('should handle large sequence numbers correctly', async () => {
        mockPrisma.asset.findFirst.mockResolvedValue({ code: 'AST-202410-9999' });

        const code = await generateUniqueCode('AST', 'assets');

        // Expected: AST-202410-10000
        expect(code).toBe('AST-202410-10000');
    });

    it('should work for purchase_requests as well', async () => {
         mockPrisma.purchaseRequest.findFirst.mockResolvedValue({ code: 'PR-202410-0005' });

         const code = await generateUniqueCode('PR', 'purchase_requests');

         expect(code).toBe('PR-202410-0006');
    });
});
