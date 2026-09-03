import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CBTController } from '../cbt.controller';
import { CBTService } from '../cbt.service';

vi.mock('../cbt.service');

describe('CBT Controller', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { id: 'user-std-1', role: 'STUDENT' },
      params: { attemptId: 'attempt-1' },
      body: {},
    };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe('recordSecurityLog', () => {
    it('should validate eventType and delegate to CBTService', async () => {
      req.body = { eventType: 'TAB_SWITCH', details: 'Minimizing browser' };
      vi.mocked(CBTService.recordSecurityLog).mockResolvedValue({ id: 'log-1' } as any);

      await CBTController.recordSecurityLog(req, res, next);

      expect(CBTService.recordSecurityLog).toHaveBeenCalledWith(
        'attempt-1',
        'user-std-1',
        { type: 'TAB_SWITCH', details: 'Minimizing browser' }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'log-1' } });
    });

    it('should throw error for invalid eventType', async () => {
      req.body = { eventType: 'INVALID_EVENT' };

      await CBTController.recordSecurityLog(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('eventType must be one of'),
      }));
    });
  });
});
