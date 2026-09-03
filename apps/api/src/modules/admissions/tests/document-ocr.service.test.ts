import { describe, it, expect } from 'vitest';
import { parseAndVerifyDocument } from '../document-ocr.service';

describe('Document OCR Service', () => {
  it('should return WARNING/0 score for unreadable blank images without marking NIK valid', async () => {
    // Blank base64 image representation without NIK text
    const blankImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const result = await parseAndVerifyDocument({
      imageBase64: blankImageBase64,
      documentType: 'ktp',
      userInputData: {
        fullName: 'Budi Santoso',
        nationalId: '3201234567890001',
      },
    });

    expect(result.success).toBe(true);
    expect(result.validation.status).not.toBe('VALID');
    expect(result.validation.nationalIdMatch).not.toBe(true);
    expect(result.validation.notes.some((n) => n.includes('tidak dapat terbaca otomatis'))).toBe(true);
  });

  it('should return VALID when document NIK matches user input NIK', async () => {
    // Base64 containing ASCII text "3201234567890001"
    const validNikText = Buffer.from('KTP NIK: 3201234567890001 BUDI SANTOSO').toString('base64');
    const imageBase64 = `data:image/jpeg;base64,${validNikText}`;

    const result = await parseAndVerifyDocument({
      imageBase64,
      documentType: 'ktp',
      userInputData: {
        fullName: 'Budi Santoso',
        nationalId: '3201234567890001',
      },
    });

    expect(result.success).toBe(true);
    expect(result.validation.status).toBe('VALID');
    expect(result.validation.nationalIdMatch).toBe(true);
    expect(result.extractedData.nationalId).toBe('3201234567890001');
  });

  it('should return MISMATCH when document NIK differs from user input NIK', async () => {
    const validNikText = Buffer.from('KTP NIK: 3201234567890001 BUDI SANTOSO').toString('base64');
    const imageBase64 = `data:image/jpeg;base64,${validNikText}`;

    const result = await parseAndVerifyDocument({
      imageBase64,
      documentType: 'ktp',
      userInputData: {
        fullName: 'Budi Santoso',
        nationalId: '9999999999999999',
      },
    });

    expect(result.success).toBe(true);
    expect(result.validation.status).toBe('MISMATCH');
    expect(result.validation.nationalIdMatch).toBe(false);
  });
});
