import { prisma } from '@/lib/prisma';
import {
  Permit,
  CreatePermitInput,
  UpdatePermitInput,
  PermitStats,
  SharedPaginatedResponse,
} from '@cipansor/shared';
import { Prisma, PermitStatus, PermitType } from '@prisma/client';
import { Errors } from '@/middleware/error';
import { createNotification } from '../notifications/service';

// ... (other imports or code)

export class PermitService {
  // ... (existing methods)

  async getPermitById(id: string) {
    const permit = await prisma.permit.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            user: { select: { name: true } },
            nis: true,
            enrollments: {
              where: { status: 'active' },
              include: { class: { select: { name: true } } },
            },
          },
        },
        approvedBy: { select: { name: true } },
      },
    });

    if (!permit) return null;

    return this.mapToPermit(permit);
  }

  // ... (rest of the file, assuming I need to apply the fix to getPermitById or similar methods where photoUrl is selected)
}

// Wait, I need to apply the fix to the actual file content. I don't have the full content yet.
// I will just read it and then apply the targeted fix using replace.
