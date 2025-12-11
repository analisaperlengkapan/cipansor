/**
 * PAUD Assessment Service Unit Tests
 * Tests for indicators, assessments, evidence, and narrative reports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PAUDAspect, PAUDAchievementLevel, PAUDReportPeriod } from '@prisma/client';

// Hoisted mocks
const { mockPrisma } = vi.hoisted(() => {
  return {
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
      $transaction: vi.fn((callback) => callback(mockPrisma)),
    },
  };
});

// Mock modules
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

import { paudAssessmentService } from '@/modules/paud-assessment';

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

      mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue(mockIndicators);
      mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(2);

      const query = { page: 1, limit: 10 };
      const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

      const result = await paudAssessmentService.findAllIndicators(query, context);

      expect(result.indicators).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockPrisma.pAUDDevelopmentIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    it('should filter indicators by aspect', async () => {
      mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue([]);
      mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, aspect: PAUDAspect.NAM };
      const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

      await paudAssessmentService.findAllIndicators(query, context);

      expect(mockPrisma.pAUDDevelopmentIndicator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            aspect: PAUDAspect.NAM,
          }),
        })
      );
    });

    it('should search indicators by name or code', async () => {
      mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue([]);
      mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, search: 'agama' };
      const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

      await paudAssessmentService.findAllIndicators(query, context);

      expect(mockPrisma.pAUDDevelopmentIndicator.findMany).toHaveBeenCalledWith(
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

      mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue(mockIndicator);

      const result = await paudAssessmentService.findIndicatorById('1');

      expect(result).toEqual(mockIndicator);
      expect(mockPrisma.pAUDDevelopmentIndicator.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          unit: { select: { id: true, name: true } },
        },
      });
    });

    it('should throw error if indicator not found', async () => {
      mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue(null);

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

      mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue(null);
      mockPrisma.pAUDDevelopmentIndicator.create.mockResolvedValue({
        id: 'new-id',
        ...input,
      });

      const result = await paudAssessmentService.createIndicator(input);

      expect(result).toHaveProperty('id', 'new-id');
      expect(mockPrisma.pAUDDevelopmentIndicator.create).toHaveBeenCalled();
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

      mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue({
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

      mockPrisma.pAUDDevelopmentAssessment.findMany.mockResolvedValue(mockAssessments);
      mockPrisma.pAUDDevelopmentAssessment.count.mockResolvedValue(1);

      const query = { page: 1, limit: 10 };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      const result = await paudAssessmentService.findAllAssessments(query, context);

      expect(result.assessments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter assessments by student', async () => {
      mockPrisma.pAUDDevelopmentAssessment.findMany.mockResolvedValue([]);
      mockPrisma.pAUDDevelopmentAssessment.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, studentId: 'student-1' };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      await paudAssessmentService.findAllAssessments(query, context);

      expect(mockPrisma.pAUDDevelopmentAssessment.findMany).toHaveBeenCalledWith(
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

      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1', name: 'Test Student' });
      mockPrisma.pAUDDevelopmentIndicator.findUnique.mockResolvedValue({
        id: 'indicator-1',
        code: 'NAM-1',
      });
      mockPrisma.pAUDDevelopmentAssessment.create.mockResolvedValue({
        id: 'assessment-1',
        ...input,
      });

      const result = await paudAssessmentService.createAssessment(input);

      expect(result).toHaveProperty('id', 'assessment-1');
      expect(mockPrisma.pAUDDevelopmentAssessment.create).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      const input = {
        studentId: 'invalid-student',
        indicatorId: 'indicator-1',
        assessmentDate: new Date(),
        achievementLevel: PAUDAchievementLevel.BSH,
        assessedById: 'teacher-1',
      };

      mockPrisma.student.findUnique.mockResolvedValue(null);

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

      mockPrisma.student.findUnique.mockResolvedValue({ 
        id: 'student-1', 
        unitId: 'unit-1' 
      });
      
      // Mock transaction to return array of created assessments
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'assessment-1', ...input.assessments[0] }
      ]);

      const result = await paudAssessmentService.bulkCreateAssessments(input, 'teacher-1');

      expect(result.count).toBe(1);
      expect(result.assessments).toHaveLength(1);
      expect(mockPrisma.student.findUnique).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
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

      mockPrisma.pAUDNarrativeReport.findMany.mockResolvedValue(mockReports);
      mockPrisma.pAUDNarrativeReport.count.mockResolvedValue(1);

      const query = { page: 1, limit: 10 };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      const result = await paudAssessmentService.findAllNarrativeReports(query, context);

      expect(result.reports).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter reports by student and unit', async () => {
      mockPrisma.pAUDNarrativeReport.findMany.mockResolvedValue([]);
      mockPrisma.pAUDNarrativeReport.count.mockResolvedValue(0);

      const query = { page: 1, limit: 10, studentId: 'student-1', unitId: 'unit-1' };
      const context = { role: 'TKQ_GURU', unitId: 'unit-1' };

      await paudAssessmentService.findAllNarrativeReports(query, context);

      const callArgs = mockPrisma.pAUDNarrativeReport.findMany.mock.calls[0][0];
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

      mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-1' });
      mockPrisma.pAUDNarrativeReport.create.mockResolvedValue({
        id: 'report-1',
        ...input,
      });

      const result = await paudAssessmentService.createNarrativeReport(input);

      expect(result).toHaveProperty('id', 'report-1');
      expect(mockPrisma.pAUDNarrativeReport.create).toHaveBeenCalled();
    });
  });
});

describe('PAUD Assessment Service - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle pagination edge case (last page)', async () => {
    mockPrisma.pAUDDevelopmentIndicator.findMany.mockResolvedValue([{ id: '1' }]);
    mockPrisma.pAUDDevelopmentIndicator.count.mockResolvedValue(21);

    const query = { page: 3, limit: 10 };
    const context = { role: 'TKQ_ADMIN', unitId: 'unit-1' };

    const result = await paudAssessmentService.findAllIndicators(query, context);

    expect(result.pagination.page).toBe(3);
    expect(result.pagination.totalPages).toBe(3);
    expect(mockPrisma.pAUDDevelopmentIndicator.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    );
  });
});
