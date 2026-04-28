import { z } from "zod";

// ── Research Projects ───────────────────────────────
export const createProjectSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    title: z.string().min(3),
    abstract: z.string().optional(),
    category: z.string().min(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    budget: z.number().positive().optional(),
    budgetId: z.string().uuid().optional(),
    fundingSource: z.string().optional(),
    methodology: z.string().optional(),
    // Optional: controller falls back to `req.user?.id` when not provided.
    leaderId: z.string().uuid().optional(),
  }),
});

export const updateProjectSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).optional(),
    abstract: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(["PROPOSAL", "APPROVED", "IN_PROGRESS", "COMPLETED", "PUBLISHED", "CANCELLED"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    budget: z.number().positive().optional(),
    budgetId: z.string().uuid().optional(),
    fundingSource: z.string().optional(),
    methodology: z.string().optional(),
    findings: z.string().optional(),
    publishedUrl: z.string().url().optional(),
    progress: z.number().min(0).max(100).optional(),
  }),
});

// ── Milestones ──────────────────────────────────────
export const createMilestoneSchema = z.object({
  body: z.object({
    projectId: z.string().uuid(),
    title: z.string().min(3),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const updateMilestoneSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

// ── Innovation Proposals ────────────────────────────
export const createProposalSchema = z.object({
  body: z.object({
    unitId: z.string().uuid(),
    title: z.string().min(3),
    description: z.string().optional(),
    category: z.string().min(1),
    impact: z.string().optional(),
    resources: z.string().optional(),
    timeline: z.string().optional(),
  }),
});

export const updateProposalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    status: z.enum(["IDEA", "EVALUATION", "PILOT", "IMPLEMENTED", "SCALED", "REJECTED"]).optional(),
    impact: z.string().optional(),
    resources: z.string().optional(),
    timeline: z.string().optional(),
    score: z.number().min(0).max(100).optional(),
    feedback: z.string().optional(),
  }),
});

export const evaluateProposalSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    score: z.number().min(0).max(100),
    feedback: z.string().optional(),
  }),
});

export const projectQuerySchema = z.object({
  query: z.object({
    unitId: z.string().uuid().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});
