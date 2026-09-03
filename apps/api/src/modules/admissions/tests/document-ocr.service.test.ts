import { describe, it, expect } from 'vitest';
import { parseAndVerifyDocument } from '../document-ocr.service';

describe('Document Verification Service', () => {
  it('should return WARNING status requiring manual officer verification for image uploads', async () => {
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
    expect(result.validation.status).toBe('WARNING');
    expect(result.validation.notes.some((n) => n.includes('verifikasi manual oleh petugas'))).toBe(true);
  });

  it('should return WARNING with extracted NIK when metadata NIK matches user input NIK', async () => {
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
    expect(result.validation.status).toBe('WARNING');
    expect(result.validation.nationalIdMatch).toBe(true);
    expect(result.extractedData.nationalId).toBe('3201234567890001');
  });

  it('should return MISMATCH when document metadata NIK differs from user input NIK', async () => {
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
