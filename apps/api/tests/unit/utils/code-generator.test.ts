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

import { generateUniqueCode, generateBulkUniqueCodes } from '@/utils/code-generator';

describe('code-generator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Use fake timers to ensure consistent date in tests
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-10-15'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('generateUniqueCode', () => {
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
    });

    describe('generateBulkUniqueCodes', () => {
        it('should generate multiple codes sequentially', async () => {
            mockPrisma.asset.findFirst.mockResolvedValue({ code: 'AST-202410-0010' });

            const codes = await generateBulkUniqueCodes('AST', 'assets', 3);

            expect(codes).toHaveLength(3);
            expect(codes).toEqual([
                'AST-202410-0011',
                'AST-202410-0012',
                'AST-202410-0013'
            ]);
            // Should query DB only once
            expect(mockPrisma.asset.findFirst).toHaveBeenCalledTimes(1);
        });

        it('should return empty array if count is 0 or less', async () => {
             const codes = await generateBulkUniqueCodes('AST', 'assets', 0);
             expect(codes).toEqual([]);
             expect(mockPrisma.asset.findFirst).not.toHaveBeenCalled();
        });

        it('should use provided transaction client', async () => {
            const mockTx = {
                asset: {
                    findFirst: vi.fn().mockResolvedValue({ code: 'AST-202410-0050' })
                },
                purchaseRequest: {
                    findFirst: vi.fn()
                }
            };

            const codes = await generateBulkUniqueCodes('AST', 'assets', 2, mockTx as any);

            expect(codes).toEqual(['AST-202410-0051', 'AST-202410-0052']);
            expect(mockTx.asset.findFirst).toHaveBeenCalledTimes(1);
            expect(mockPrisma.asset.findFirst).not.toHaveBeenCalled();
        });
    });
});
