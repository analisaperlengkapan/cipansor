import { DocumentParseRequest, DocumentOcrResult } from '@cipansor/shared';

export type DocumentParseResult = DocumentOcrResult;

/**
 * Document Verification Service
 * Note: Raw binary base64 image data does not execute visual optical character recognition (OCR)
 * without an external visual OCR engine. All uploaded document images require manual officer verification.
 * This service safely extracts plain text ASCII metadata if present and flags all image uploads
 * for officer review, ensuring no compressed image bytes produce false 'VALID' visual matches.
 */
export async function parseAndVerifyDocument(
  payload: DocumentParseRequest
): Promise<DocumentOcrResult> {
  const { imageBase64, documentType, userInputData } = payload;
  const extractedData: DocumentOcrResult['extractedData'] = {};
  const notes: string[] = [];

  let extractedCount = 0;

  if (imageBase64) {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Extract ASCII text metadata if present
    const textContent = Buffer.from(cleanBase64, 'base64').toString('utf8');
    const digitsMatches = textContent.match(/\b\d{16}\b/g) || [];

    if (digitsMatches.length > 0) {
      if (documentType === 'ktp') {
        extractedData.nationalId = digitsMatches[0];
        extractedCount++;
      } else if (documentType === 'kk') {
        extractedData.familyCardNumber = digitsMatches[0];
        extractedCount++;
        if (digitsMatches.length > 1) {
          extractedData.nationalId = digitsMatches[1];
          extractedCount++;
        }
      }
    }

    const lines = textContent.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const nameMatch = trimmed.match(/(?:Nama|NAMA)\s*[:=]?\s*([A-Za-z\s]{3,50})/i);
      if (nameMatch && nameMatch[1]) {
        extractedData.fullName = nameMatch[1].trim();
        extractedCount++;
        break;
      }
    }
  }

  let nationalIdMatch: boolean | undefined = undefined;
  let familyCardMatch: boolean | undefined = undefined;
  let fullNameMatch: boolean | undefined = undefined;
  let isMismatch = false;

  if (userInputData) {
    if (userInputData.nationalId) {
      if (extractedData.nationalId) {
        nationalIdMatch = extractedData.nationalId === userInputData.nationalId;
        if (nationalIdMatch) {
          notes.push('NIK sesuai dengan metadata dokumen.');
        } else {
          isMismatch = true;
          notes.push('NIK pada dokumen tidak sesuai dengan data input.');
        }
      } else {
        notes.push('Teks NIK memerlukan verifikasi manual oleh petugas.');
      }
    }

    if (userInputData.familyCardNumber) {
      if (extractedData.familyCardNumber) {
        familyCardMatch = extractedData.familyCardNumber === userInputData.familyCardNumber;
        if (familyCardMatch) {
          notes.push('Nomor KK sesuai dengan metadata dokumen.');
        } else {
          isMismatch = true;
          notes.push('Nomor KK pada dokumen tidak sesuai dengan data input.');
        }
      } else {
        notes.push('Teks Nomor KK memerlukan verifikasi manual oleh petugas.');
      }
    }

    if (userInputData.fullName && userInputData.fullName.length >= 3) {
      if (extractedData.fullName) {
        const normInput = userInputData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normExtracted = extractedData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        fullNameMatch = normInput.includes(normExtracted) || normExtracted.includes(normInput);
        if (!fullNameMatch) {
          isMismatch = true;
          notes.push('Nama pada dokumen tidak sesuai dengan data input.');
        }
      }
    }
  }

  notes.push('Dokumen telah diterima dan memerlukan verifikasi manual oleh petugas panitia SPMB.');

  const status: DocumentOcrResult['validation']['status'] = isMismatch ? 'MISMATCH' : 'WARNING';
  const matchScore = isMismatch ? 0 : 50;

  return {
    success: true,
    documentType,
    extractedData,
    validation: {
      nationalIdMatch,
      familyCardMatch,
      fullNameMatch,
      matchScore,
      status,
      notes,
    },
  };
}
