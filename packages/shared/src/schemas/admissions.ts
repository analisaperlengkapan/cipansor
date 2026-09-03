import { z } from "zod";

export const parseDocumentSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "Dokumen base64/image wajib diisi")
    .max(2800000, "Ukuran berkas melebihi batas maksimum (2MB)")
    .refine(
      (val) => /^data:(image\/(jpeg|jpg|png|webp)|application\/pdf);base64,/i.test(val),
      "Tipe berkas tidak didukung. Hanya gambar (JPEG/PNG/WebP) dan PDF yang diperbolehkan"
    ),
  documentType: z.enum(["ktp", "kk", "akta", "foto", "lainnya"]),
  userInputData: z
    .object({
      fullName: z.string().optional(),
      nationalId: z.string().optional(),
      familyCardNumber: z.string().optional(),
    })
    .optional(),
});

export type ParseDocumentRequest = z.infer<typeof parseDocumentSchema>;

export const createPublicRegistrantDocumentSchema = z.object({
  type: z.string().min(1, "Tipe dokumen wajib diisi"),
  url: z.string().optional(),
  base64: z.string().optional(),
  fileName: z.string().optional(),
  registrationToken: z.string().min(1, "Registration token wajib diisi"),
  ocrNotes: z.array(z.string()).optional(),
  ocrStatus: z.enum(["WARNING", "MISMATCH"]).optional(),
});

export type CreatePublicRegistrantDocumentRequest = z.infer<
  typeof createPublicRegistrantDocumentSchema
>;

export interface RegistrantDTO {
  id: string;
  admissionPeriodId: string;
  unitId?: string | null;
  registrationNo: string;
  fullName: string;
  name?: string;
  gender: "MALE" | "FEMALE";
  birthPlace: string;
  birthDate: string;
  address: string;
  phone?: string | null;
  email?: string | null;
  previousSchool?: string | null;
  quranAbility?: string | null;
  memorizedJuz?: number | null;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  parentOccupation?: string | null;
  source?: string | null;
  campaign?: { id: string; name: string; code: string } | null;
  status: string;
  testScore?: number | null;
  interviewScore?: number | null;
  tahfidzScore?: number | null;
  registrationFeePaidAt?: string | null;
  registrationFeeAmount?: number | null;
  acceptedAt?: string | null;
  enrolledAt?: string | null;
  createdAt: string;
  admissionPeriod?: {
    id: string;
    name: string;
    unitId?: string | null;
    registrationFee?: number | null;
    unit?: { id: string; name: string; type: string };
  };
  documents?: RegistrantDocumentDTO[];
}

export interface RegistrantDocumentDTO {
  id: string;
  registrantId: string;
  name: string;
  type: string;
  fileUrl: string;
  isVerified: boolean;
  notes?: string | null;
  createdAt: string;
}
