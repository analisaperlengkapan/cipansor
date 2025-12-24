import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '../src/modules/notifications/email-sms.service';
import { Twilio } from 'twilio';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notification-id-123' }),
    },
  },
}));

// Mock Logger
vi.mock('../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Global mock for create method
const mockCreate = vi.fn();

// Mock Twilio
vi.mock('twilio', () => {
  return {
    Twilio: class {
      messages = {
        create: mockCreate,
      };
      constructor() {}
    },
  };
});

describe('NotificationService - SMS', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockReset();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should log SMS when Twilio is not configured', async () => {
    // Ensure Twilio env vars are unset
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_PHONE_NUMBER;

    const result = await notificationService.send({
      channel: 'SMS',
      recipientPhone: '+1234567890',
      message: 'Test message',
      type: 'GENERAL',
      title: 'Test',
    });

    expect(result.success).toBe(true);
    expect(result.channel).toBe('SMS');
    expect(result.messageId).toMatch(/^log_/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should send SMS via Twilio when configured', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_PHONE_NUMBER = '+1000000000';

    mockCreate.mockResolvedValue({ sid: 'SM12345' });

    const result = await notificationService.send({
      channel: 'SMS',
      recipientPhone: '+1234567890',
      message: 'Test message',
      type: 'GENERAL',
      title: 'Test',
    });

    expect(mockCreate).toHaveBeenCalledWith({
      body: 'Test message',
      from: '+1000000000',
      to: '+1234567890',
    });
    expect(result.success).toBe(true);
    expect(result.channel).toBe('SMS');
    expect(result.messageId).toBe('SM12345');
  });

  it('should handle Twilio errors gracefully', async () => {
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_PHONE_NUMBER = '+1000000000';

    mockCreate.mockRejectedValue(new Error('Twilio error'));

    const result = await notificationService.send({
      channel: 'SMS',
      recipientPhone: '+1234567890',
      message: 'Test message',
      type: 'GENERAL',
      title: 'Test',
    });

    expect(result.success).toBe(false);
    expect(result.channel).toBe('SMS');
    expect(result.error).toBe('Twilio error');
  });
});
