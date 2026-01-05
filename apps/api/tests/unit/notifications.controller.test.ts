import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as controller from '../../src/modules/notifications/controller';
import * as service from '../../src/modules/notifications/service';
import { Errors } from '../../src/middleware/error';

vi.mock('../../src/modules/notifications/service');
vi.mock('../../src/modules/notifications/whatsapp.service');
vi.mock('../../src/modules/notifications/scheduler.service');

describe('Notifications Controller', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { sub: 'user-id', role: 'USER' }
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('getNotificationById', () => {
    it('should return notification when user is owner', async () => {
      req.params.id = 'notif-1';
      req.user.sub = 'owner-id';
      const mockNotification = { id: 'notif-1', userId: 'owner-id', title: 'Test' };
      (service.getNotificationById as any).mockResolvedValue(mockNotification);

      await controller.getNotificationById(req, res, next);

      expect(service.getNotificationById).toHaveBeenCalledWith('notif-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockNotification });
    });

    it('should return notification when user is admin', async () => {
      req.params.id = 'notif-1';
      req.user.role = 'SUPER_ADMIN';
      req.user.sub = 'admin-id';
      const mockNotification = { id: 'notif-1', userId: 'other-user', title: 'Test' };
      (service.getNotificationById as any).mockResolvedValue(mockNotification);

      await controller.getNotificationById(req, res, next);

      expect(service.getNotificationById).toHaveBeenCalledWith('notif-1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockNotification });
    });

    it('should throw Forbidden error when user is not owner and not admin', async () => {
      req.params.id = 'notif-1';
      req.user.sub = 'other-user';
      req.user.role = 'USER';
      const mockNotification = { id: 'notif-1', userId: 'owner-id', title: 'Test' };
      (service.getNotificationById as any).mockResolvedValue(mockNotification);

      await controller.getNotificationById(req, res, next);

      const expectedError = Errors.forbidden("You do not have permission to view this notification");
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expectedError.message,
        code: expectedError.code
      }));
    });

    it('should throw NotFound error when notification does not exist', async () => {
      req.params.id = 'non-existent';
      (service.getNotificationById as any).mockResolvedValue(null);

      await controller.getNotificationById(req, res, next);

      const expectedError = Errors.notFound("Notification not found");
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expectedError.message,
        code: expectedError.code
      }));
    });
  });
});
