import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/utils/encryption';
import { Prisma } from '@prisma/client';

export class SecretsService {
  static async list(unitId?: string) {
    const where: Prisma.SystemSecretWhereInput = unitId ? { unitId } : { unitId: null };
    const secrets = await prisma.systemSecret.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return secrets.map(s => ({
      id: s.id,
      key: s.key,
      description: s.description,
      maskedValue: '********', // Never return actual value in list
      updatedAt: s.updatedAt,
    }));
  }

  static async upsert(data: { key: string; value: string; description?: string; unitId?: string | null }) {
    const encryptedValue = encrypt(data.value);

    // We treat unitId undefined as null for global
    const targetUnitId = data.unitId || null;

    // We must ensure the 'key' is unique per unit.
    // The schema has @@unique([unitId, key])
    // However, Prisma might have trouble with unique constraint involving nulls if not handled explicitly in 'where'
    // But let's try standard upsert.

    return prisma.systemSecret.upsert({
      where: {
        unitId_key: {
          unitId: targetUnitId as string, // Cast to string because Prisma types might be strict, but actually it allows null if mapped correctly.
                                          // If generated types for unitId_key.unitId include null, it's fine.
                                          // Usually Prisma generates `unitId: string | null`.
          key: data.key,
        },
      },
      update: {
        value: encryptedValue,
        description: data.description,
      },
      create: {
        unitId: targetUnitId,
        key: data.key,
        value: encryptedValue,
        description: data.description,
      },
    });
  }

  static async delete(id: string) {
    return prisma.systemSecret.delete({
      where: { id },
    });
  }

  // Internal use only - to get decrypted value
  static async getValue(key: string, unitId: string | null = null) {
     const secret = await prisma.systemSecret.findUnique({
        where: {
            unitId_key: {
                unitId: unitId,
                key: key
            }
        }
     });
     if (!secret) return null;
     return decrypt(secret.value);
  }
}
