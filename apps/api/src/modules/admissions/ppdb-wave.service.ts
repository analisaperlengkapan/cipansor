import { prisma } from '@/lib/prisma';
import { WaveStatus } from '@prisma/client';
import { CreateWaveInput, UpdateWaveInput } from './ppdb-wave.schema';

export const waveService = {
  /**
   * Get all waves with pagination
   */
  async findAll(params: { page: number; limit: number; periodId?: string; status?: string }) {
    const { page, limit, periodId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(periodId && { periodId }),
      ...(status && { status: status as WaveStatus }),
    };

    const [data, total] = await Promise.all([
      prisma.admissionWave.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ waveNumber: 'asc' }],
        include: {
          period: {
            select: {
              id: true,
              name: true,
              academicYear: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.admissionWave.count({ where }),
    ]);

    const wavesWithStats = data.map((wave) => ({
      ...wave,
      remainingQuota: wave.quota - wave.registeredCount,
      isFull: wave.registeredCount >= wave.quota,
    }));

    return {
      data: wavesWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get active waves for period (for public registration)
   */
  async findActiveForPeriod(periodId: string) {
    const now = new Date();

    const waves = await prisma.admissionWave.findMany({
      where: {
        periodId,
        status: 'OPEN',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { waveNumber: 'asc' },
    });

    return waves.map((wave) => ({
      id: wave.id,
      name: wave.name,
      waveNumber: wave.waveNumber,
      startDate: wave.startDate,
      endDate: wave.endDate,
      quota: wave.quota,
      registeredCount: wave.registeredCount,
      acceptedCount: wave.acceptedCount,
      remainingQuota: wave.quota - wave.registeredCount,
      isFull: wave.registeredCount >= wave.quota,
      registrationFee: wave.registrationFee,
      notes: wave.notes,
    }));
  },

  /**
   * Get wave by ID
   */
  async findById(id: string) {
    const wave = await prisma.admissionWave.findUnique({
      where: { id },
      include: {
        period: {
          include: {
            academicYear: true,
            unit: { select: { id: true, name: true } },
          },
        },
        registrants: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wave) return null;

    return {
      ...wave,
      remainingQuota: wave.quota - wave.registeredCount,
      isFull: wave.registeredCount >= wave.quota,
    };
  },

  /**
   * Create wave
   */
  async create(input: CreateWaveInput) {
    // Check for duplicate wave number in same period
    const existing = await prisma.admissionWave.findFirst({
      where: {
        periodId: input.periodId,
        waveNumber: input.waveNumber,
      },
    });

    if (existing) {
      throw new Error(`Wave number ${input.waveNumber} already exists for this period`);
    }

    return prisma.admissionWave.create({
      data: {
        periodId: input.periodId,
        waveNumber: input.waveNumber,
        name: input.name,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        quota: input.quota,
        registrationFee: input.registrationFee,
        status: input.status ?? 'UPCOMING',
        notes: input.notes,
      },
      include: {
        period: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Update wave
   */
  async update(id: string, input: UpdateWaveInput) {
    const data: any = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.waveNumber !== undefined) data.waveNumber = input.waveNumber;
    if (input.quota !== undefined) data.quota = input.quota;
    if (input.registrationFee !== undefined) data.registrationFee = input.registrationFee;
    if (input.status !== undefined) data.status = input.status;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.startDate) data.startDate = new Date(input.startDate);
    if (input.endDate) data.endDate = new Date(input.endDate);

    return prisma.admissionWave.update({
      where: { id },
      data,
      include: {
        period: { select: { id: true, name: true } },
      },
    });
  },

  /**
   * Delete wave
   */
  async delete(id: string) {
    // Check if wave has registrants
    const wave = await prisma.admissionWave.findUnique({
      where: { id },
    });

    if (wave && wave.registeredCount > 0) {
      throw new Error(
        `Cannot delete wave with ${wave.registeredCount} registrants. Remove registrants first.`
      );
    }

    return prisma.admissionWave.delete({
      where: { id },
    });
  },

  /**
   * Get wave statistics
   */
  async getStats(periodId: string) {
    const waves = await prisma.admissionWave.findMany({
      where: { periodId },
      orderBy: { waveNumber: 'asc' },
    });

    const waveStats = waves.map((wave) => ({
      id: wave.id,
      name: wave.name,
      waveNumber: wave.waveNumber,
      quota: wave.quota,
      registeredCount: wave.registeredCount,
      acceptedCount: wave.acceptedCount,
      remainingQuota: wave.quota - wave.registeredCount,
      isFull: wave.registeredCount >= wave.quota,
      fillRate: Math.round((wave.registeredCount / wave.quota) * 100),
      acceptanceRate:
        wave.registeredCount > 0
          ? Math.round((wave.acceptedCount / wave.registeredCount) * 100)
          : 0,
      status: wave.status,
      startDate: wave.startDate,
      endDate: wave.endDate,
    }));

    const totalRegistrants = waveStats.reduce((sum, w) => sum + w.registeredCount, 0);
    const totalAccepted = waveStats.reduce((sum, w) => sum + w.acceptedCount, 0);
    const totalQuota = waveStats.reduce((sum, w) => sum + w.quota, 0);

    return {
      periodId,
      waveCount: waves.length,
      totalRegistrants,
      totalAccepted,
      totalQuota,
      overallFillRate: totalQuota > 0 ? Math.round((totalRegistrants / totalQuota) * 100) : 0,
      overallAcceptanceRate:
        totalRegistrants > 0 ? Math.round((totalAccepted / totalRegistrants) * 100) : 0,
      waves: waveStats,
    };
  },

  /**
   * Assign registrant to wave and increment count
   */
  async assignRegistrant(registrantId: string, waveId: string) {
    // Atomically increment registeredCount only if quota is not yet reached.
    // This prevents race conditions where concurrent requests could both pass
    // a non-atomic quota check and exceed the wave's quota.
    return prisma.$transaction(async (tx) => {
      const wave = await tx.admissionWave.findUnique({
        where: { id: waveId },
      });

      if (!wave) {
        throw new Error('Wave not found');
      }

      // Look up the registrant's current wave (if any) so we can decrement
      // the old wave's registeredCount when reassigning. Without this,
      // the old wave's count stays inflated forever.
      const existing = await tx.registrant.findUnique({
        where: { id: registrantId },
        select: { waveId: true },
      });

      if (!existing) {
        throw new Error('Registrant not found');
      }

      // No-op if already assigned to the target wave.
      if (existing.waveId === waveId) {
        return tx.registrant.findUnique({
          where: { id: registrantId },
          include: {
            wave: { select: { id: true, name: true, waveNumber: true } },
          },
        });
      }

      // Atomic conditional update: only increments if registeredCount < quota.
      // updateMany returns count=0 if no rows matched, signaling the wave was full.
      const incrementResult = await tx.admissionWave.updateMany({
        where: {
          id: waveId,
          registeredCount: { lt: wave.quota },
        },
        data: { registeredCount: { increment: 1 } },
      });

      if (incrementResult.count === 0) {
        throw new Error('Wave quota is full');
      }

      // Decrement the previous wave's count (clamped at 0 to avoid negatives
      // in case of prior data drift).
      if (existing.waveId) {
        await tx.admissionWave.updateMany({
          where: { id: existing.waveId, registeredCount: { gt: 0 } },
          data: { registeredCount: { decrement: 1 } },
        });
      }

      const updatedRegistrant = await tx.registrant.update({
        where: { id: registrantId },
        data: { waveId },
        include: {
          wave: { select: { id: true, name: true, waveNumber: true } },
        },
      });

      return updatedRegistrant;
    });
  },

  /**
   * Get registrants by wave
   */
  async getRegistrantsByWave(
    waveId: string,
    params: {
      page: number;
      limit: number;
      status?: string;
    }
  ) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      waveId,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      prisma.registrant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admissionPeriod: { select: { id: true, name: true } },
        },
      }),
      prisma.registrant.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Update wave status automatically based on dates and quota
   */
  async updateWaveStatuses() {
    const now = new Date();

    // Mark waves as OPEN if start date has passed and they're UPCOMING
    await prisma.admissionWave.updateMany({
      where: {
        status: 'UPCOMING',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      data: { status: 'OPEN' },
    });

    // Mark waves as CLOSED if end date has passed. We must include both OPEN
    // and UPCOMING waves here: if `updateWaveStatuses` was never run while a
    // wave's period was active (e.g. the cron job was down, or the wave's
    // entire start..end window elapsed between two cron runs), an UPCOMING
    // wave would otherwise be permanently stranded — Step 1 above requires
    // `endDate >= now` to transition UPCOMING -> OPEN, so once `endDate < now`
    // the wave can never leave UPCOMING without this fallback.
    await prisma.admissionWave.updateMany({
      where: {
        status: { in: ['OPEN', 'UPCOMING'] },
        endDate: { lt: now },
      },
      data: { status: 'CLOSED' },
    });

    // Mark waves as FULL if quota is reached
    const fullWaves = await prisma.admissionWave.findMany({
      where: {
        status: 'OPEN',
      },
    });

    for (const wave of fullWaves) {
      if (wave.registeredCount >= wave.quota) {
        await prisma.admissionWave.update({
          where: { id: wave.id },
          data: { status: 'FULL' },
        });
      }
    }
  },
};

export default waveService;
