export interface DocumentOcrResult {
  extractedData: {
    nationalId?: string;
    familyCardNumber?: string;
    fullName?: string;
    birthDate?: string;
  };
  validation: {
    matchScore: number;
    status: "VALID" | "WARNING" | "MISMATCH";
    nationalIdMatch?: boolean;
    familyCardMatch?: boolean;
    fullNameMatch?: boolean;
    notes: string[];
  };
}
