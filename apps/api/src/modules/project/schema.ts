import { z } from 'zod';
import { ProjectStatus, TaskPriority } from '@prisma/client';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    managerId: z.string().uuid(),
    unitId: z.string().uuid(),
    budget: z.number().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    managerId: z.string().uuid().optional(),
    budget: z.number().optional(),
  }),
});

export const createProjectTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.coerce.date().optional(),
    assigneeId: z.string().uuid().optional(),
    columnId: z.string().uuid().optional(),
    order: z.number().optional(),
  }),
});

export const updateProjectTaskSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z.coerce.date().optional(),
    assigneeId: z.string().uuid().optional(),
    columnId: z.string().uuid().optional(),
    order: z.number().optional(),
  }),
});

export const createColumnSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    order: z.number().optional(),
    color: z.string().optional(),
  }),
});

export const updateColumnSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    order: z.number().optional(),
    color: z.string().optional(),
  }),
});

export const updateTaskPositionSchema = z.object({
  body: z.object({
    columnId: z.string().uuid(),
    order: z.number(),
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>['body'];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body'];
export type CreateProjectTaskInput = z.infer<typeof createProjectTaskSchema>['body'];
export type UpdateProjectTaskInput = z.infer<typeof updateProjectTaskSchema>['body'];
export type CreateColumnInput = z.infer<typeof createColumnSchema>['body'];
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>['body'];
export type UpdateTaskPositionInput = z.infer<typeof updateTaskPositionSchema>['body'];
