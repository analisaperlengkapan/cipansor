import { z } from 'zod';

export const createAuditSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  auditType: z.string().min(1),
  plannedDate: z.string().datetime(),
  scope: z.string().optional(),
  methodology: z.string().optional(),
  unitId: z.string().uuid().optional(),
  strategicPlanId: z.string().uuid().optional(),
  riskId: z.string().uuid().optional(),
});

export const updateAuditSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  auditType: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  plannedDate: z.string().datetime().optional(),
  executedDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  scope: z.string().optional(),
  methodology: z.string().optional(),
  conclusion: z.string().optional(),
});

export const createFindingSchema = z.object({
  auditId: z.string().uuid(),
  findingNumber: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(1),
  severity: z.enum(['OBSERVATION', 'MINOR', 'MAJOR', 'CRITICAL']),
  category: z.string().min(1),
  evidence: z.string().optional(),
  rootCause: z.string().optional(),
  recommendation: z.string().optional(),
  responsibleId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  planObjectiveId: z.string().uuid().optional(),
});

export const updateFindingSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  severity: z.enum(['OBSERVATION', 'MINOR', 'MAJOR', 'CRITICAL']).optional(),
  category: z.string().optional(),
  evidence: z.string().optional(),
  rootCause: z.string().optional(),
  recommendation: z.string().optional(),
  responsibleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().optional(),
  planObjectiveId: z.string().uuid().nullable().optional(),
});

export const createFollowUpSchema = z.object({
  findingId: z.string().uuid(),
  action: z.string().min(1),
  dueDate: z.string().datetime().optional(),
  evidence: z.string().optional(),
});

export const updateFollowUpSchema = z.object({
  action: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'OVERDUE']).optional(),
  evidence: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const listAuditQuerySchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  auditType: z.string().optional(),
  strategicPlanId: z.string().uuid().optional(),
  riskId: z.string().uuid().optional(),
});
