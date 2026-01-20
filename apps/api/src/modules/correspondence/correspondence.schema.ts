import { z } from 'zod';
import { LetterDirection, LetterUrgency, LetterNature, LetterStatus } from '@cipansor/shared';

export const createLetterSchema = z.object({
  unitId: z.string().uuid(),
  direction: z.nativeEnum(LetterDirection),
  classificationId: z.string().uuid().optional(),
  agendaNumber: z.string().optional(),
  letterNumber: z.string().optional(),
  date: z.string().datetime(),
  receivedAt: z.string().datetime().optional(),
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
});

export const reviewLetterSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().optional(),
});

export const createDispositionSchema = z.object({
  letterId: z.string().uuid(),
  recipientId: z.string().uuid(),
  instruction: z.string().min(1),
  deadline: z.string().datetime().optional(),
  parentDispositionId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateDispositionStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'COMPLETED']),
  notes: z.string().optional(),
});
