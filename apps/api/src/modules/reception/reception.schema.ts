import { z } from 'zod';
import { VisitStatus, PackageStatus } from '@cipansor/shared';

export const createGuestBookSchema = z.object({
  name: z.string().min(1),
  institution: z.string().optional(),
  purpose: z.string().min(1),
  phone: z.string().optional(),
  visitorCount: z.number().int().min(1).default(1),
  vehicleNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const updateGuestBookSchema = z.object({
  checkOut: z.string().datetime().optional(), // ISO date string
  notes: z.string().optional(),
});

export const createStudentVisitSchema = z.object({
  studentId: z.string().uuid(),
  visitorName: z.string().min(1),
  relation: z.string().min(1),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStudentVisitSchema = z.object({
  checkOut: z.string().datetime().optional(),
  status: z.nativeEnum(VisitStatus).optional(),
  notes: z.string().optional(),
});

export const createStudentPackageSchema = z.object({
  studentId: z.string().uuid(),
  senderName: z.string().min(1),
  senderPhone: z.string().optional(),
  description: z.string().optional(),
  photoUrl: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStudentPackageSchema = z.object({
  status: z.nativeEnum(PackageStatus).optional(),
  deliveredTo: z.string().optional(),
  notes: z.string().optional(),
});
