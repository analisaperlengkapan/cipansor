import { z } from "zod";

export const parseDocumentSchema = z.object({
  imageBase64: z.string().min(1, "Dokumen base64/image wajib diisi"),
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
