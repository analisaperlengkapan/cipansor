/**
 * PAUD Assessment Service Unit Tests
 * Tests for indicators, assessments, evidence, and narrative reports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mocks as local variables (not using top-level `const` that relies on hoisting in a way that breaks `vi.mock`)
// But for `vi.mock` to work with variables, they must be inside the factory or hoisted via `vi.hoisted`.

const mocks = vi.hoisted(() => {
  return {
    PAUDAspect: { NAM: 'NAM', FM: 'FM' },
    PAUDAchievementLevel: { BSH: 'BSH' },
    PAUDReportPeriod: { SEMESTER: 'SEMESTER' },
    UserRole: { TKQ_ADMIN: 'TKQ_ADMIN', TKQ_GURU: 'TKQ_GURU' },
    mockPrisma: {
      pAUDDevelopmentIndicator: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      pAUDDevelopmentAssessment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      pAUDAssessmentEvidence: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      pAUDNarrativeReport: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      student: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(mocks.mockPrisma)),
    }
  };
});

// Mock modules
vi.mock('@/lib/prisma', () => ({
  prisma: mocks.mockPrisma,
}));

// Mock @prisma/client imports specifically for this test file
vi.mock('@prisma/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    PAUDAspect: mocks.PAUDAspect,
    PAUDAchievementLevel: mocks.PAUDAchievementLevel,
    PAUDReportPeriod: mocks.PAUDReportPeriod,
    UserRole: mocks.UserRole,
  };
});

import { paudAssessmentService } from '@/modules/paud-assessment';
// Import Enums from the mocked module (which will return our hoisted mocks)
import { PAUDAspect, PAUDAchievementLevel, PAUDReportPeriod } from '@prisma/client';

describe('PAUD Assessment Service - Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllIndicators', () => {
    it('should return paginated indicators', async () => {
      const mockIndicators = [
        {
          id: '1',
          aspect: PAUDAspect.NAM,
          code: 'NAM-1',
          name: 'Test Indicator 1',
          ageGroupMin: 48,
          ageGroupMax: 60,
        },
        {
          id: '2',
          aspect: PAUDAspect.FM,
          code: 'FM-1',
          name: 'Test Indicator 2',
          ageGroupMin: 48,
          ageGroupMax: 60,
        },
      ];

      mocks.mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue(mockIndicators);
      mocks.mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(2);

      const query = { page: 1, limit: 10 };
      const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

      const result = await paudAssessmentService.findAllIndicators(query, context);

      expect(result.indicators).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter indicators by aspect', async () => {
      mocks.mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue([]);
      mocks.mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, aspect: PAUDAspect.NAM };
      const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

      await paudAssessmentService.findAllIndicators(query, context);

      expect(mocks.mockPrisma.pAUDDevelopmentIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            aspect: PAUDAspect.NAM,
          }),
        })
      );
    });

    it('should search indicators by name or code', async () => {
      mocks.mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue([]);
      mocks.mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, search: 'agama' };
      const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

      await paudAssessmentService.findAllIndicators(query, context);

      expect(mocks.mockPrisma.pAUDDevelopmentIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'agama', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });
  });

  describe('findIndicatorById', () => {
    it('should return indicator by id', async () => {
      const mockIndicator = {
        id: '1',
        aspect: PAUDAspect.NAM,
        code: 'NAM-1',
        name: 'Test Indicator',
        unit: { id: 'unit-1', name: 'TK Qur\'an' },
      };

      mocks.mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue(mockIndicator);

      const result = await paudAssessmentService.findIndicatorById('1');

      expect(result).toEqual(mockIndicator);
    });

    it('should throw error if indicator not found', async () => {
      mocks.mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue(null);

      await expect(paudAssessmentService.findIndicatorById('invalid-id')).rejects.toThrow(
        'Indicator not found'
      );
    });
  });

  describe('createIndicator', () => {
    it('should create new indicator', async () => {
      const input = {
        unitId: 'unit-1',
        aspect: PAUDAspect.NAM,
        code: 'NAM-NEW',
        name: 'New Indicator',
        description: 'Test description',
        ageGroupMin: 48,
        ageGroupMax: 60,
      };

      mocks.mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue(null);
      mocks.mockPrisma.pAUDDevelopmentIndicator.create.mockResolvedValue({
        id: 'new-id',
        ...input,
      });

      const result = await paudAssessmentService.createIndicator(input);

      expect(result).toHaveProperty('id', 'new-id');
    });

    it('should throw error if code already exists', async () => {
      const input = {
        unitId: 'unit-1',
        aspect: PAUDAspect.NAM,
        code: 'NAM-1',
        name: 'Duplicate',
        description: 'Test',
        ageGroupMin: 48,
        ageGroupMax: 60,
      };

      mocks.mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue({
        id: 'existing-id',
        code: 'NAM-1',
      });

      await expect(paudAssessmentService.createIndicator(input)).rejects.toThrow(
        'Indicator with this code already exists'
      );
    });
  });
});

describe('PAUD Assessment Service - Assessments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllAssessments', () => {
    it('should return paginated assessments', async () => {
      const mockAssessments = [
        {
          id: '1',
          studentId: 'student-1',
          indicatorId: 'indicator-1',
          achievementLevel: PAUDAchievementLevel.BSH,
          assessmentDate: new Date('2024-01-15'),
        },
      ];

      mocks.mockPrisma.pAUDDevelopmentAssessment.findMany.mockResolvedValue(mockAssessments);
      mocks.mockPrisma.pAUDDevelopmentAssessment.count.mockResolvedValue(1);

      const query = { page: 1, limit: 10 };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      const result = await paudAssessmentService.findAllAssessments(query, context);

      expect(result.assessments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter assessments by student', async () => {
      mocks.mockPrisma.pAUDDevelopmentAssessment.findMany.mockResolvedValue([]);
      mocks.mockPrisma.pAUDDevelopmentAssessment.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, studentId: 'student-1' };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      await paudAssessmentService.findAllAssessments(query, context);

      expect(mocks.mockPrisma.pAUDDevelopmentAssessment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: 'student-1',
          }),
        })
      );
    });
  });

  describe('createAssessment', () => {
    it('should create new assessment', async () => {
      const input = {
        studentId: 'student-1',
        indicatorId: 'indicator-1',
        assessmentDate: new Date('2024-01-15'),
        achievementLevel: PAUDAchievementLevel.BSH,
        notes: 'Good progress',
        assessedById: 'teacher-1',
      };

      mocks.mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1', name: 'Test Student' });
      mocks.mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue({
        id: 'indicator-1',
        code: 'NAM-1',
      });
      mocks.mockPrisma.pAUDDevelopmentAssessment.create.mockResolvedValue({
        id: 'assessment-1',
        ...input,
      });

      const result = await paudAssessmentService.createAssessment(input);

      expect(result).toHaveProperty('id', 'assessment-1');
    });

    it('should throw error if student not found', async () => {
      const input = {
        studentId: 'invalid-student',
        indicatorId: 'indicator-1',
        assessmentDate: new Date(),
        achievementLevel: PAUDAchievementLevel.BSH,
        assessedById: 'teacher-1',
      };

      mocks.mockPrisma.student.findUnique.mockResolvedValue(null);

      await expect(paudAssessmentService.createAssessment(input)).rejects.toThrow(
        'Student not found'
      );
    });
  });

  describe('bulkCreateAssessments', () => {
    it('should validate student and create assessments in transaction', async () => {
      const input = {
        studentId: 'student-1',
        unitId: 'unit-1',
        academicYearId: 'ay-1',
        semester: 1,
        periodType: 'HARIAN',
        periodDate: '2024-01-15',
        assessments: [
          {
            aspect: PAUDAspect.NAM,
            indicatorId: 'indicator-1',
            achievementLevel: PAUDAchievementLevel.BSH,
            narrativeText: 'Good',
          },
        ],
      };

      mocks.mockPrisma.student.findUnique.mockResolvedValue({
        id: 'student-1', 
        unitId: 'unit-1' 
      });
      
      // Mock transaction to return array of created assessments
      mocks.mockPrisma.$transaction.mockResolvedValue([
        { id: 'assessment-1', ...input.assessments[0] }
      ]);

      const result = await paudAssessmentService.bulkCreateAssessments(input, 'teacher-1');

      expect(result.count).toBe(1);
      expect(result.assessments).toHaveLength(1);
    });
  });
});

describe('PAUD Assessment Service - Narrative Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllNarrativeReports', () => {
    it('should return paginated narrative reports', async () => {
      const mockReports = [
        {
          id: '1',
          studentId: 'student-1',
          periodType: PAUDReportPeriod.SEMESTER,
          aspect: PAUDAspect.NAM,
          achievementLevel: PAUDAchievementLevel.BSH,
        },
      ];

      mocks.mockPrisma.pAUDNarrativeReport.findMany.mockResolvedValue(mockReports);
      mocks.mockPrisma.pAUDNarrativeReport.count.mockResolvedValue(1);

      const query = { page: 1, limit: 10 };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      const result = await paudAssessmentService.findAllNarrativeReports(query, context);

      expect(result.reports).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter reports by student and unit', async () => {
      mocks.mockPrisma.pAUDNarrativeReport.findMany.mockResolvedValue([]);
      mocks.mockPrisma.pAUDNarrativeReport.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, studentId: 'student-1', unitId: 'unit-1' };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      await paudAssessmentService.findAllNarrativeReports(query, context);

      const callArgs = mocks.mockPrisma.pAUDNarrativeReport.findMany.mock.calls[0][0];
      expect(callArgs.where).toHaveProperty('studentId', 'student-1');
      expect(callArgs.where).toHaveProperty('unitId', 'unit-1');
    });
  });

  describe('createNarrativeReport', () => {
    it('should create new narrative report', async () => {
      const input = {
        studentId: 'student-1',
        periodType: PAUDReportPeriod.SEMESTER,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-06-30'),
        aspect: PAUDAspect.NAM,
        achievementLevel: PAUDAchievementLevel.BSH,
        narrative: 'Student shows good development',
        createdById: 'teacher-1',
      };

      mocks.mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
      mocks.mockPrisma.pAUDNarrativeReport.create.mockResolvedValue({
        id: 'report-1',
        ...input,
      });

      const result = await paudAssessmentService.createNarrativeReport(input);

      expect(result).toHaveProperty('id', 'report-1');
    });
  });
});

describe('PAUD Assessment Service - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle pagination edge case (last page)', async () => {
    mocks.mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue([{ id: '1' }]);
    mocks.mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(21);

    const query = { page: 3, limit: 10 };
    const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

    const result = await paudAssessmentService.findAllIndicators(query, context);

    expect(result.pagination.page).toBe(3);
    expect(result.pagination.totalPages).toBe(3);
  });
});
