import { describe, it, expect } from 'vitest';
import { NOTIFICATION_CHANNEL_LABELS, NOTIFICATION_CHANNELS } from './use-notifications';

describe('Frontend Email Notification Hooks & Constants', () => {
  it('exports EMAIL channel and label correctly for UI', () => {
    expect(NOTIFICATION_CHANNELS).toContain('EMAIL');
    expect(NOTIFICATION_CHANNEL_LABELS.EMAIL).toBe('Email');
    expect(NOTIFICATION_CHANNEL_LABELS.WHATSAPP).toBe('WhatsApp');
  });
});
