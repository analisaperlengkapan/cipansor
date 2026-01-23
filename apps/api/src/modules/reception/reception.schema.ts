import { z } from 'zod';
import { VisitStatus, PackageStatus } from '@prisma/client';

export const createGuestBookSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    institution: z.string().optional(),
    purpose: z.string().min(1, 'Purpose is required'),
    phone: z.string().optional(),
    visitorCount: z.number().int().min(1).default(1),
    vehicleNumber: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateGuestBookSchema = z.object({
  body: z.object({
    checkOut: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const createStudentVisitSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    visitorName: z.string().min(1, 'Visitor name is required'),
    relation: z.string().min(1, 'Relation is required'),
    purpose: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateStudentVisitSchema = z.object({
  body: z.object({
    checkOut: z.string().datetime().optional(),
    status: z.nativeEnum(VisitStatus).optional(),
    notes: z.string().optional(),
  }),
});

export const createStudentPackageSchema = z.object({
  body: z.object({
    studentId: z.string().uuid(),
    senderName: z.string().min(1, 'Sender name is required'),
    senderPhone: z.string().optional(),
    description: z.string().optional(),
    photoUrl: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updateStudentPackageSchema = z.object({
  body: z.object({
    status: z.nativeEnum(PackageStatus).optional(),
    deliveredTo: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type CreateGuestBookInput = z.infer<typeof createGuestBookSchema>['body'];
export type UpdateGuestBookInput = z.infer<typeof updateGuestBookSchema>['body'];
export type CreateStudentVisitInput = z.infer<typeof createStudentVisitSchema>['body'];
export type UpdateStudentVisitInput = z.infer<typeof updateStudentVisitSchema>['body'];
export type CreateStudentPackageInput = z.infer<typeof createStudentPackageSchema>['body'];
export type UpdateStudentPackageInput = z.infer<typeof updateStudentPackageSchema>['body'];
