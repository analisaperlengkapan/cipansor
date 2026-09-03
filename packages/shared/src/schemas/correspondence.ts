import { z } from "zod";
import {
  LetterDirection,
  LetterDispatchChannel,
  LetterUrgency,
  LetterNature,
  LetterStatus,
  LetterType,
} from "../types/correspondence";

export const listParticipantsQuerySchema = z.object({
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export type ListParticipantsQueryInput = z.infer<typeof listParticipantsQuerySchema>;

/**
 * Satu lampiran. `fileUrl` sudah harus ada — berkasnya diunggah lebih dulu
 * lewat POST /upload, dan yang disimpan di sini hanyalah rujukannya.
 */
export const letterAttachmentSchema = z.object({
  name: z.string().min(1).max(255),
  fileUrl: z.string().min(1).max(1024),
  mimeType: z.string().max(128).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export type LetterAttachmentSchemaInput = z.infer<typeof letterAttachmentSchema>;

export const createLetterSchema = z.object({
  unitId: z.string().uuid(),
  direction: z.nativeEnum(LetterDirection),
  type: z.nativeEnum(LetterType).optional(),
  classificationId: z.string().uuid().optional(),
  agendaNumber: z.string().optional(),
  letterNumber: z.string().optional(),
  date: z.string(),
  receivedAt: z.string().optional(),
  subject: z.string().min(1),
  content: z.string().optional(),
  fileUrl: z.string().url().optional(),
  urgency: z.nativeEnum(LetterUrgency),
  nature: z.nativeEnum(LetterNature),
  status: z.nativeEnum(LetterStatus),
  senderName: z.string().optional(),
  senderTitle: z.string().optional(),
  senderInstance: z.string().optional(),
  recipientName: z.string().optional(),
  recipientInstance: z.string().optional(),
  reviewerIds: z.array(z.string().uuid()).optional(),
  recipientIds: z.array(z.string().uuid()).optional(),
  ccIds: z.array(z.string().uuid()).optional(),
  attachments: z.array(letterAttachmentSchema).max(20).optional(),
});

export type CreateLetterSchemaInput = z.infer<typeof createLetterSchema>;

export const reviewLetterSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
  nextReviewerId: z.string().uuid().optional(),
  isFinalSigner: z.boolean().optional(),
});

export type ReviewLetterSchemaInput = z.infer<typeof reviewLetterSchema>;

export const createDispositionSchema = z.object({
  letterId: z.string().uuid(),
  recipientId: z.string().uuid().optional(),
  recipientIds: z.array(z.string().uuid()).optional(),
  instruction: z.string().min(1),
  deadline: z.string().optional(),
  parentDispositionId: z.string().uuid().optional(),
  notes: z.string().optional(),
}).refine((data) => data.recipientId || (data.recipientIds && data.recipientIds.length > 0), {
  message: 'Harus memilih minimal satu penerima disposisi',
  path: ['recipientIds'],
});

export type CreateDispositionSchemaInput = z.infer<typeof createDispositionSchema>;

export const updateDispositionStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
  notes: z.string().optional(),
});

export type UpdateDispositionStatusSchemaInput = z.infer<typeof updateDispositionStatusSchema>;

export const letterNoteSchema = z.object({
  note: z.string().max(2000).optional(),
});

export type LetterNoteSchemaInput = z.infer<typeof letterNoteSchema>;

/**
 * Pencatatan pengiriman naskah keluar.
 *
 * `dispatchedAt` boleh mundur — petugas sering mencatat setelah kurir kembali —
 * tetapi tidak boleh maju: sebuah surat tidak dapat dikirim besok, dan tanggal
 * kirim yang mendahului hari ini adalah satu-satunya angka yang membuat
 * statistik "surat terkirim" salah tanpa terlihat salah.
 */
export const dispatchLetterSchema = z.object({
  channel: z.nativeEnum(LetterDispatchChannel),
  dispatchedAt: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: "Tanggal pengiriman tidak sah",
    })
    .refine((v) => !v || Date.parse(v) <= Date.now() + 60_000, {
      message: "Tanggal pengiriman tidak boleh di masa depan",
    }),
  receivedByName: z.string().max(255).optional(),
  trackingNumber: z.string().max(120).optional(),
  receiptUrl: z.string().max(1024).optional(),
  note: z.string().max(2000).optional(),
});

export type DispatchLetterSchemaInput = z.infer<typeof dispatchLetterSchema>;

export const submitLetterSchema = z.object({
  note: z.string().max(2000).optional(),
  reviewerIds: z.array(z.string().uuid()).optional(),
});

export type SubmitLetterSchemaInput = z.infer<typeof submitLetterSchema>;
