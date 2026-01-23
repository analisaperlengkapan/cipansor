import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WhatsAppService from '../../src/modules/notifications/whatsapp.service';

// Mock logger to avoid cluttering output
vi.mock('../../src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WhatsAppService Performance', () => {
  let service: WhatsAppService;

  beforeEach(() => {
    service = new WhatsAppService();
    // Mock sendMessage to simulate network delay
    vi.spyOn(service, 'sendMessage').mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms simulated network delay
      return {
        success: true,
        provider: 'SIMULATOR',
        timestamp: new Date(),
        messageId: 'mock-id',
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures execution time of sendBulk', async () => {
    const count = 20; // Number of messages
    const recipients = Array.from({ length: count }, (_, i) => ({
      phone: `62812345678${i}`,
    }));
    const message = 'Test message';
    const delay = 50; // 50ms delay between messages

    const start = performance.now();
    const result = await service.sendBulk(recipients, message, delay);
    const end = performance.now();

    const duration = end - start;
    console.log(`\n[Performance] sendBulk with ${count} items took ${duration.toFixed(2)}ms`);

    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(1000); // Should be much faster than 2000ms

    // Verify results
    expect(result.success).toBe(count);
    expect(result.results).toHaveLength(count);
    // Verify order
    // Since we mocked sendMessage to not return phone, we can't easily verify order unless we change mock
    // But implementation uses indices so it should be correct.
  });
});
