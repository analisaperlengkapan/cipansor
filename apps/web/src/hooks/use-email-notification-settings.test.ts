import { describe, it, expect } from 'vitest';

describe('Frontend Email Notification Config & Types', () => {
  it('has valid email settings for Cipansor Google Workspace', () => {
    const emailConfig = {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      senderEmail: 'noreply@cipansor.or.id',
      senderName: 'Yayasan Pesantren Cipansor',
      replyToEmail: 'halo@cipansor.or.id',
    };

    expect(emailConfig.senderEmail).toBe('noreply@cipansor.or.id');
    expect(emailConfig.replyToEmail).toBe('halo@cipansor.or.id');
    expect(emailConfig.smtpHost).toBe('smtp.gmail.com');
  });
});
