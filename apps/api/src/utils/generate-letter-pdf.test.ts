import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateLetterPdfBuffer, LetterPdfInput } from './generate-letter-pdf';

describe('generateLetterPdfBuffer determinism', () => {
  it('generates 100% byte-identical PDFs when called twice with the same letter data', async () => {
    const mockLetter: LetterPdfInput = {
      id: 'letter-123',
      letterNumber: '001/YPC/X/2025',
      agendaNumber: 'AG-001',
      date: new Date('2025-05-15T00:00:00.000Z'),
      type: 'SURAT_DINAS',
      nature: 'PUBLIC',
      subject: 'Undangan Rapat Kerja Yayasan',
      content: 'Dengan hormat,\n\nSehubungan dengan agenda tahunan Yayasan Pesantren Cipansor...',
      senderName: 'Ustadz Ahmad',
      senderTitle: 'Sekretaris Yayasan',
      recipientName: 'Bapak Kepala Sekolah',
      unit: {
        name: 'SMP IT CIPANSOR',
        address: 'Jl. Pesantren No. 12',
        phone: '081234567890',
        email: 'smpit@cipansor.or.id',
      },
      signatures: [
        {
          verificationToken: 'test-token-abcdef123456',
          signedAt: new Date('2025-05-15T10:00:00.000Z'),
          signer: {
            name: 'Ustadz Ahmad',
            teacher: { nip: '198501012010011001' },
          },
        },
      ],
    };

    const pdf1 = await generateLetterPdfBuffer(mockLetter);
    const pdf2 = await generateLetterPdfBuffer(mockLetter);

    const hash1 = crypto.createHash('sha256').update(pdf1).digest('hex');
    const hash2 = crypto.createHash('sha256').update(pdf2).digest('hex');

    expect(hash1).toEqual(hash2);
    expect(pdf1.equals(pdf2)).toBe(true);
  });
});
