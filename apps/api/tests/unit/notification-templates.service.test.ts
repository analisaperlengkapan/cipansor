import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from '../../src/modules/notifications/service';
import { prisma } from '../../src/lib/prisma';

// Mock prisma
vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    setting: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Notification Service - Templates', () => {
  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Template 1',
      content: 'Hello {{name}}',
      isActive: true,
      type: 'INFO',
    },
    {
      id: 'template-2',
      name: 'Template 2',
      content: 'Your bill is due',
      isActive: false,
      type: 'PAYMENT',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTemplateById', () => {
    it('should return a template when found', async () => {
      (prisma.setting.findFirst as any).mockResolvedValue({
        value: mockTemplates,
      });

      const result = await service.getTemplateById('template-1');
      expect(result).toEqual(mockTemplates[0]);
    });

    it('should return null when template is not found in existing settings', async () => {
      (prisma.setting.findFirst as any).mockResolvedValue({
        value: mockTemplates,
      });

      const result = await service.getTemplateById('non-existent');
      expect(result).toBeNull();
    });

    it('should return null when no settings found', async () => {
      (prisma.setting.findFirst as any).mockResolvedValue(null);

      const result = await service.getTemplateById('template-1');
      expect(result).toBeNull();
    });

    it('should return null when settings value is not an array', async () => {
      (prisma.setting.findFirst as any).mockResolvedValue({
        value: 'invalid-json',
      });

      const result = await service.getTemplateById('template-1');
      expect(result).toBeNull();
    });
  });
});
