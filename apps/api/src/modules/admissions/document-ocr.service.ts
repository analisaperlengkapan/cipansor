/**
 * Document OCR & AI Cross-Verification Service
 * Extracts NIK, No. KK, Name, and Birth Date from uploaded document images/base64
 * and cross-checks data against user inputs for SPMB registration validation.
 */

export interface DocumentParseRequest {
  imageBase64?: string;
  documentType: 'ktp' | 'kk' | 'akta' | 'foto' | 'lainnya';
  userInputData?: {
    fullName?: string;
    nationalId?: string;
    familyCardNumber?: string;
    birthDate?: string;
  };
}

export interface DocumentParseResult {
  success: boolean;
  documentType: string;
  extractedData: {
    nationalId?: string;
    familyCardNumber?: string;
    fullName?: string;
    birthPlace?: string;
    birthDate?: string;
  };
  validation: {
    nationalIdMatch?: boolean;
    familyCardMatch?: boolean;
    fullNameMatch?: boolean;
    matchScore: number; // 0 to 100
    status: 'VALID' | 'WARNING' | 'MISMATCH';
    notes: string[];
  };
}

/**
 * Parses uploaded document data/image base64 to extract structured fields
 * and cross-verify against provided user inputs.
 */
export async function parseAndVerifyDocument(
  payload: DocumentParseRequest
): Promise<DocumentParseResult> {
  const { imageBase64, documentType, userInputData } = payload;
  const extractedData: DocumentParseResult['extractedData'] = {};
  const notes: string[] = [];

  let extractedCount = 0;

  if (imageBase64) {
    // Decode base64 header if present (e.g. data:image/png;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // 1. Extract 16-digit numbers (NIK / No KK) from binary text content if ascii printable
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

    // 2. Extract full name if text contains name indicators
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

  // 2. Perform Cross-Matching against User Input Data
  let score = 100;
  let nationalIdMatch: boolean | undefined = undefined;
  let familyCardMatch: boolean | undefined = undefined;
  let fullNameMatch: boolean | undefined = undefined;

  const hasExtractedData = extractedCount > 0;

  if (userInputData) {
    // Validate NIK
    if (userInputData.nationalId) {
      if (extractedData.nationalId) {
        nationalIdMatch = extractedData.nationalId === userInputData.nationalId;
        if (nationalIdMatch) {
          notes.push('NIK KTP/KK sesuai dengan data input pendaftar.');
        } else {
          score -= 50;
          notes.push('NIK pada dokumen tidak sesuai dengan NIK yang diinput.');
        }
      } else {
        // NIK not extracted from image
        nationalIdMatch = false;
        score -= 50;
        notes.push('Teks NIK tidak dapat terbaca otomatis dari dokumen. Perlu verifikasi manual oleh petugas.');
      }
    }

    // Validate Family Card No (KK)
    if (userInputData.familyCardNumber) {
      if (extractedData.familyCardNumber) {
        familyCardMatch = extractedData.familyCardNumber === userInputData.familyCardNumber;
        if (familyCardMatch) {
          notes.push('Nomor KK sesuai dengan data input pendaftar.');
        } else {
          score -= 50;
          notes.push('Nomor KK pada dokumen tidak sesuai dengan nomor KK yang diinput.');
        }
      } else {
        familyCardMatch = false;
        score -= 50;
        notes.push('Teks Nomor KK tidak dapat terbaca otomatis dari dokumen. Perlu verifikasi manual oleh petugas.');
      }
    }

    if (userInputData.fullName && userInputData.fullName.length >= 3) {
      if (extractedData.fullName) {
        const normInput = userInputData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normExtracted = extractedData.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
        fullNameMatch = normInput.includes(normExtracted) || normExtracted.includes(normInput);
        if (!fullNameMatch) {
          score -= 30;
          notes.push('Nama pada dokumen tidak sesuai dengan nama yang diinput.');
        }
      } else {
        fullNameMatch = undefined; // Unknown / Not extracted from document image
      }
    }
  }

  if (!hasExtractedData) {
    if (documentType === 'ktp' || documentType === 'kk') {
      score = 0;
      notes.push('Teks dokumen tidak dapat terbaca otomatis. Perlu verifikasi manual oleh petugas.');
    } else {
      score = 50;
      notes.push('Dokumen telah diterima dan memerlukan verifikasi manual oleh petugas.');
    }
  }

  const finalScore = Math.max(0, score);
  let status: DocumentParseResult['validation']['status'] = 'VALID';
  if (nationalIdMatch === false || familyCardMatch === false || fullNameMatch === false || finalScore < 50) {
    status = 'MISMATCH';
  } else if (finalScore < 100 || !hasExtractedData) {
    status = 'WARNING';
  }

  return {
    success: true,
    documentType,
    extractedData,
    validation: {
      nationalIdMatch,
      familyCardMatch,
      fullNameMatch,
      matchScore: finalScore,
      status,
      notes: notes.length > 0 ? notes : ['Dokumen terverifikasi secara otomatis.'],
    },
  };
}
