import { describe, it, expect, vi, afterAll, beforeAll } from 'vitest';
import { whatsAppService } from '../../src/modules/notifications/whatsapp.service';

describe('WhatsApp Service Performance', () => {
  // Mock sendMessage to simulate network latency
  const originalSendMessage = whatsAppService.sendMessage;
  const LATENCY = 200; // 200ms latency

  beforeAll(() => {
    whatsAppService.sendMessage = vi.fn().mockImplementation(async (opts) => {
      await new Promise((resolve) => setTimeout(resolve, LATENCY));
      return {
        success: true,
        messageId: 'mock-id',
        provider: 'SIMULATOR',
        timestamp: new Date(),
      };
    });
  });

  afterAll(() => {
    whatsAppService.sendMessage = originalSendMessage;
  });

  it('measures sendBulk performance with 100ms delay', async () => {
    const recipients = Array(5)
      .fill(0)
      .map((_, i) => ({ phone: `62812345678${i}` }));
    const DELAY = 100;

    const start = performance.now();
    await whatsAppService.sendBulk(recipients, 'test message', DELAY);
    const end = performance.now();
    const duration = end - start;

    console.log(
      `Duration for 5 messages with ${DELAY}ms delay and ${LATENCY}ms latency: ${duration.toFixed(2)}ms`
    );
  });

  it('measures sendBulk performance with 0ms delay', async () => {
    const recipients = Array(5)
      .fill(0)
      .map((_, i) => ({ phone: `62812345678${i}` }));
    const DELAY = 0;

    const start = performance.now();
    await whatsAppService.sendBulk(recipients, 'test message', DELAY);
    const end = performance.now();
    const duration = end - start;

    console.log(
      `Duration for 5 messages with ${DELAY}ms delay and ${LATENCY}ms latency: ${duration.toFixed(2)}ms`
    );
  });
});
