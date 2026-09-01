import { z } from "zod";

export const listParticipantsQuerySchema = z.object({
  search: z.string().optional(),
  unitId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(100),
});

export type ListParticipantsQueryInput = z.infer<typeof listParticipantsQuerySchema>;
