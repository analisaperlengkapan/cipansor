import { z } from "zod";
import { SecurityEventType } from "../types/assessment";

export const recordSecurityLogSchema = z.object({
  attemptId: z.string().uuid(),
  eventType: z.nativeEnum(SecurityEventType),
  details: z.record(z.unknown()).optional().nullable(),
});

export type RecordSecurityLogInput = z.infer<typeof recordSecurityLogSchema>;
