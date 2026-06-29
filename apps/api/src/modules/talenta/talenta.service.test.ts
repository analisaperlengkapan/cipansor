import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import { talentaService } from './talenta.service';

// Mock external dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    talentProfile: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    talentAssessment: {
      create: vi.fn(),
    },
    trainingProgram: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    trainingEnrollment: {
      create: vi.fn(),
    },
    successionPlan: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    orgPosition: {
      findUnique: vi.fn(),
    },
    pKGEvaluation: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Talenta Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Talent Profiles', () => {
    it('should create a new talent profile', async () => {
      const dto = {
        userId: 'user-1',
        unitId: 'unit-1',
        currentRole: 'Staff IT',
        category: 'EMERGING' as any,
        careerAspiration: 'IT Manager',
      };

      vi.mocked(prisma.talentProfile.create).mockResolvedValue({ id: 'prof-1', ...dto } as any);

      const result = await talentaService.createProfile(dto);

      expect(prisma.talentProfile.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currentRole: 'Staff IT',
          careerAspiration: 'IT Manager',
        }),
        include: expect.any(Object),
      });
      expect(result.id).toBe('prof-1');
    });
  });

  describe('suggestSuccessors', () => {
    it('should rank successors with training bonus and keyword match', async () => {
      const mockProfiles = [
        {
          id: 'prof-1',
          currentRole: 'Teacher',
          category: 'HIGH_POTENTIAL',
          user: {
            id: 'user-1',
            name: 'High Potential Trained',
            trainingEnrollments: [{ id: 'enr-1', program: { category: 'Common' } }, { id: 'enr-2', program: { category: 'Common' } }]
          },
          assessments: []
        },
        {
          id: 'prof-2',
          currentRole: 'Teacher',
          category: 'HIGH_POTENTIAL',
          user: {
            id: 'user-2',
            name: 'High Potential Untrained',
            trainingEnrollments: []
          },
          assessments: []
        }
      ];

      vi.mocked(prisma.talentProfile.findMany).mockResolvedValue(mockProfiles as any);

      const result = await talentaService.suggestSuccessors('Teacher', 'unit-1');

      // Both are HIGH_POTENTIAL (base 80)
      // prof-1 has 2 trainings => 10 bonus, 'Teacher' match => 10 bonus => 100
      // prof-2 has 0 trainings => 0 bonus, 'Teacher' match => 10 bonus => 90
      expect(result[0].name).toBe('High Potential Trained');
      expect(result[0].matchScore).toBe(100);
      expect(result[1].name).toBe('High Potential Untrained');
      expect(result[1].matchScore).toBe(90);
    });

    it('should consider competency gaps from position requirements', async () => {
      const mockPosition = {
        id: 'pos-1',
        requirements: JSON.stringify({ "Leadership": 5, "Management": 4 })
      };

      const mockProfiles = [
        {
          id: 'prof-1',
          currentRole: 'Coordinator',
          category: 'KEY_TALENT', // base 70
          user: {
            id: 'user-1',
            name: 'Good Fit',
            trainingEnrollments: []
          },
          assessments: [{
            competencies: { "Leadership": 4, "Management": 4 } // Gap = (1+0)/2 = 0.5. Score = 25 - (0.5 * 5) = 22.5
          }]
        }
      ];

      vi.mocked(prisma.orgPosition.findUnique).mockResolvedValue(mockPosition as any);
      vi.mocked(prisma.talentProfile.findMany).mockResolvedValue(mockProfiles as any);

      const result = await talentaService.suggestSuccessors('Director', 'unit-1', 'pos-1');

      // Base 70 + keyword 0 + training 0 + sharia 0 + competency 22.5 = 92.5 -> 93
      expect(result[0].matchScore).toBe(93);
      expect(result[0].competencyMatch).toBe(90); // 22.5 / 25 * 100 = 90%
    });
  });

  describe('Assessments', () => {
    it('should create assessment and update profile category correctly', async () => {
      const dto = {
        talentId: 'prof-1',
        assessorId: 'user-2',
        period: 'Q1 2026',
        performanceRating: 'OUTSTANDING' as any,   // 5
        potentialRating: 'EXCEEDS' as any,         // 4 => sum = 9 => HIGH_POTENTIAL
        overallScore: 90,
        assessedAt: new Date().toISOString(),
      };

      vi.mocked(prisma.talentAssessment.create).mockResolvedValue({ id: 'assess-1' } as any);
      vi.mocked(prisma.talentProfile.update).mockResolvedValue({} as any);

      await talentaService.createAssessment(dto);

      expect(prisma.talentAssessment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          period: 'Q1 2026',
          overallScore: 90,
        }),
        include: expect.any(Object),
      });

      expect(prisma.talentProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: expect.objectContaining({
          category: 'HIGH_POTENTIAL',
          lastAssessedAt: expect.any(Date),
        }),
      });
    });

    it('should calculate category based on internal logic', async () => {
       const dto = {
        talentId: 'prof-1',
        assessorId: 'user-2',
        period: 'Q1 2026',
        performanceRating: 'MEETS' as any,   // 3
        potentialRating: 'BELOW' as any,     // 2 => sum = 5 => EMERGING
        overallScore: 70,
        assessedAt: new Date().toISOString(),
      };

      vi.mocked(prisma.talentAssessment.create).mockResolvedValue({ id: 'assess-2' } as any);
      vi.mocked(prisma.talentProfile.update).mockResolvedValue({} as any);

      await talentaService.createAssessment(dto);

      expect(prisma.talentProfile.update).toHaveBeenCalledWith({
        where: { id: 'prof-1' },
        data: expect.objectContaining({
          category: 'EMERGING',
        }),
      });
    });

    it('should sync from PKG and map scores correctly', async () => {
      const teacherId = 'teacher-1';
      const periodId = 'period-1';
      const mockPKG = {
        totalScore: { toNumber: () => 92 }, // Outstanding
        assessorId: 'assessor-1',
        teacher: { userId: 'user-1' }
      };
      const mockProfile = { id: 'prof-1', assessments: [] };

      vi.mocked(prisma.pKGEvaluation.findUnique).mockResolvedValue(mockPKG as any);
      vi.mocked(prisma.talentProfile.findUnique).mockResolvedValue(mockProfile as any);
      vi.mocked(prisma.talentAssessment.create).mockResolvedValue({} as any);
      vi.mocked(prisma.talentProfile.update).mockResolvedValue({} as any);

      await talentaService.syncFromPKG(teacherId, periodId);

      expect(prisma.talentAssessment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            performanceRating: 'OUTSTANDING',
            overallScore: 92,
          })
        })
      );
    });
  });

  describe('Training Programs', () => {
    it('should enroll user in training program', async () => {
      vi.mocked(prisma.trainingEnrollment.create).mockResolvedValue({ id: 'enr-1' } as any);

      await talentaService.enrollUser('prog-1', 'user-1');

      expect(prisma.trainingEnrollment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          program: { connect: { id: 'prog-1' } },
          user: { connect: { id: 'user-1' } },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('Succession Planning', () => {
    it('should create succession plan', async () => {
      const dto = {
        positionTitle: 'Kepala Sekolah',
        currentHolderId: 'user-1',
        successorId: 'user-2',
        readinessLevel: 'READY_IN_1_YEAR',
        priority: 'HIGH' as any,
        unitId: 'unit-1',
      };

      vi.mocked(prisma.successionPlan.create).mockResolvedValue({ id: 'succ-1', ...dto } as any);

      await talentaService.createSuccession(dto);

      expect(prisma.successionPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          positionTitle: 'Kepala Sekolah',
          currentHolder: { connect: { id: 'user-1' } },
          successor: { connect: { id: 'user-2' } },
        }),
        include: expect.any(Object),
      });
    });

    it('should update succession plan and handle relations', async () => {
      const updateDto = {
        positionTitle: 'Direktur Utama',
        currentHolderId: 'user-3',
        successorId: null, // this should cause disconnect
      };

      vi.mocked(prisma.successionPlan.update).mockResolvedValue({ id: 'succ-1', ...updateDto } as any);

      await talentaService.updateSuccession('succ-1', updateDto);

      expect(prisma.successionPlan.update).toHaveBeenCalledWith({
        where: { id: 'succ-1' },
        data: expect.objectContaining({
          positionTitle: 'Direktur Utama',
          currentHolder: { connect: { id: 'user-3' } },
          successor: { disconnect: true },
        }),
        include: expect.any(Object),
      });
    });
  });
});
