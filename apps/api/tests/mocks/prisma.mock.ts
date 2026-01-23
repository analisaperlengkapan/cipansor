/**
 * Prisma Mock for unit testing
 * Uses a deep mock of the Prisma client
 */

import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Create a type-safe mock of PrismaClient
type MockPrismaClient = {
  [K in keyof PrismaClient]: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
} & {
  $connect: ReturnType<typeof vi.fn>;
  $disconnect: ReturnType<typeof vi.fn>;
  $transaction: ReturnType<typeof vi.fn>;
  $queryRaw: ReturnType<typeof vi.fn>;
};

// Create mock implementations for common Prisma methods
const createModelMock = () => ({
  findMany: vi.fn().mockResolvedValue([]),
  findUnique: vi.fn().mockResolvedValue(null),
  findFirst: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockImplementation((data) => Promise.resolve({ id: 'mock-id', ...data.data })),
  update: vi
    .fn()
    .mockImplementation((data) => Promise.resolve({ id: data.where.id, ...data.data })),
  delete: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  count: vi.fn().mockResolvedValue(0),
  aggregate: vi.fn().mockResolvedValue({ _count: { _all: 0 }, _sum: {}, _avg: {} }),
  groupBy: vi.fn().mockResolvedValue([]),
});

export const prismaMock: MockPrismaClient = {
  user: createModelMock(),
  student: createModelMock(),
  teacher: createModelMock(),
  staff: createModelMock(),
  unit: createModelMock(),
  class: createModelMock(),
  academicYear: createModelMock(),
  attendance: createModelMock(),
  tahfidzRecord: createModelMock(),
  invoice: createModelMock(),
  payment: createModelMock(),
  alumni: createModelMock(),
  murojaahRecord: createModelMock(),
  simaanExam: createModelMock(),
  grade: createModelMock(),
  exam: createModelMock(),
  subject: createModelMock(),
  book: createModelMock(),
  borrowing: createModelMock(),
  registrant: createModelMock(),
  admissionPeriod: createModelMock(),
  dashboardMetricSnapshot: createModelMock(),
  unitComparisonReport: createModelMock(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn().mockImplementation((fn) => fn(prismaMock)),
  $queryRaw: vi.fn().mockResolvedValue([]),
} as unknown as MockPrismaClient;

// Helper to reset all mocks
export const resetPrismaMocks = () => {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        }
      });
    }
  });
};

export default prismaMock;
