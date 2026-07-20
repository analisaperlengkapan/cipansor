import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as controller from '../../src/modules/notifications/notifications.controller';
import * as service from '../../src/modules/notifications/notifications.service';
import { Errors } from '../../src/middleware/error';

vi.mock('../../src/modules/notifications/notifications.service');

describe('Notification Templates Controller', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { sub: 'user-id', role: 'SUPER_ADMIN', unitId: 'unit-1' },
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('getTemplateById', () => {
    it('should return template when found', async () => {
      req.params.id = 'template-1';
      const mockTemplate = { id: 'template-1', name: 'Test' };
      (service.getTemplateById as any).mockResolvedValue(mockTemplate);

      await controller.getTemplateById(req, res, next);

      expect(service.getTemplateById).toHaveBeenCalledWith('template-1', 'unit-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTemplate });
    });

    it('should pass undefined unitId if not present on user', async () => {
      req.params.id = 'template-1';
      req.user.unitId = undefined;
      const mockTemplate = { id: 'template-1', name: 'Test' };
      (service.getTemplateById as any).mockResolvedValue(mockTemplate);

      await controller.getTemplateById(req, res, next);

      expect(service.getTemplateById).toHaveBeenCalledWith('template-1', undefined);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockTemplate });
    });

    it('should throw NotFound error when template is not found', async () => {
      req.params.id = 'non-existent';
      (service.getTemplateById as any).mockResolvedValue(null);

      await controller.getTemplateById(req, res, next);

      const expectedError = Errors.notFound('Template not found');
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expectedError.message,
          code: expectedError.code,
        })
      );
    });
  });
});
