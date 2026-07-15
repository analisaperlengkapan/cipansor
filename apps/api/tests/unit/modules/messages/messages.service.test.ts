import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Use vi.hoisted to initialize mocks first
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  userFindUnique: vi.fn(),
}));

// 2. Mock @prisma/client
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      message = {
        create: mocks.create,
        findMany: mocks.findMany,
        count: mocks.count,
        findUnique: mocks.findUnique,
        findFirst: mocks.findFirst,
        update: mocks.update,
      };
      user = {
        findUnique: mocks.userFindUnique,
      };
      $disconnect = vi.fn();
    },
    UserRole: {
      SUPER_ADMIN: 'SUPER_ADMIN',
    },
    Prisma: {
      sql: vi.fn(),
      empty: '',
    },
  };
});

// 3. Mock src/lib/prisma
vi.mock('../../../../src/lib/prisma', () => ({
  prisma: {
    message: {
      create: mocks.create,
      findMany: mocks.findMany,
      count: mocks.count,
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
    user: {
      findUnique: mocks.userFindUnique,
    },
  },
}));

vi.mock('../../../../src/lib/logger');
vi.mock('../../../../src/lib/event-bus');

import { MessagesService } from '../../../../src/modules/messages/messages.service';
import { Errors } from '../../../../src/middleware/error';

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(() => {
    service = new MessagesService();
    vi.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a message if recipient exists', async () => {
      const senderId = 'sender-123';
      const input: any = {
        recipientId: 'recipient-123',
        subject: 'Test Subject',
        content: 'Test Content',
        category: 'GENERAL' as const,
      };

      mocks.userFindUnique.mockResolvedValue({ id: input.recipientId });
      mocks.create.mockResolvedValue({ id: 'msg-1', ...input, senderId, isRead: false });

      const result = await service.createMessage(senderId, input);

      expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { id: input.recipientId } });
      expect(mocks.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw Not Found if recipient does not exist', async () => {
      mocks.userFindUnique.mockResolvedValue(null);

      await expect(
        service.createMessage('sender-123', {
          recipientId: 'invalid-id',
          subject: 'Test',
          content: 'Test',
          category: 'GENERAL',
        } as any)
      ).rejects.toThrow(Errors.notFound('Recipient'));
    });
  });

  describe('getUserMessages', () => {
    it('should return paginated messages', async () => {
      const userId = 'user-123';
      const params = { page: 1, limit: 10, type: 'inbox' as const };

      mocks.findMany.mockResolvedValue([]);
      mocks.count.mockResolvedValue(0);

      const result = await service.getUserMessages(userId, params);

      expect(mocks.findMany).toHaveBeenCalled();
      expect(mocks.count).toHaveBeenCalled();
      expect(result.pagination).toBeDefined();
    });
  });
});
