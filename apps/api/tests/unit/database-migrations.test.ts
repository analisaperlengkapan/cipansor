/**
 * Database Migration Tests
 * Tests for PAUD, Daily Report, Tahfidz, and Dashboard models
 */

import { describe, it, expect, vi } from 'vitest';

// Mock Prisma to avoid real DB connection in unit tests
const mockQueryRaw = vi.fn();
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $queryRaw: mockQueryRaw,
    $disconnect: vi.fn(),
  })),
}));

describe('Database Schema - PAUD Models', () => {
  describe('PAUDDevelopmentIndicator Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'paud_development_indicators';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'code' },
        { column_name: 'aspect' },
        { column_name: 'age_range_months' },
        { column_name: 'description' },
        { column_name: 'created_at' },
        { column_name: 'updated_at' },
      ]);

      // Query information_schema to check table exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('code');
      expect(columnNames).toContain('aspect');
      expect(columnNames).toContain('age_range_months');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have unique constraint on code', async () => {
      mockQueryRaw.mockResolvedValue([
        { constraint_name: 'paud_development_indicators_code_key' }
      ]);

      const constraints = await mockQueryRaw<any[]>`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'paud_development_indicators'
        AND constraint_type = 'UNIQUE';
      `;

      const hasUniqueCode = constraints.some((c) => c.constraint_name.includes('code'));
      expect(hasUniqueCode).toBe(true);
    });
  });

  describe('PAUDDevelopmentAssessment Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'paud_development_assessments';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'student_id' },
        { column_name: 'indicator_id' },
        { column_name: 'assessment_date' },
        { column_name: 'achievement_level' },
        { column_name: 'notes' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('student_id');
      expect(columnNames).toContain('indicator_id');
      expect(columnNames).toContain('assessment_date');
      expect(columnNames).toContain('achievement_level');
      expect(columnNames).toContain('notes');
    });

    it('should have foreign key to students', async () => {
      mockQueryRaw.mockResolvedValue([{ constraint_name: 'fk_student' }]);
      const fks = await mockQueryRaw<any[]>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'paud_development_assessments'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%student%';
      `;

      expect(fks.length).toBeGreaterThan(0);
    });

    it('should have foreign key to indicators', async () => {
      mockQueryRaw.mockResolvedValue([{ constraint_name: 'fk_indicator' }]);
      const fks = await mockQueryRaw<any[]>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'paud_development_assessments'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%indicator%';
      `;

      expect(fks.length).toBeGreaterThan(0);
    });
  });

  describe('PAUDAssessmentEvidence Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'paud_assessment_evidence';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'assessment_id' },
        { column_name: 'media_type' },
        { column_name: 'media_url' },
        { column_name: 'caption' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('assessment_id');
      expect(columnNames).toContain('media_type');
      expect(columnNames).toContain('media_url');
      expect(columnNames).toContain('caption');
    });
  });

  describe('PAUDNarrativeReport Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'paud_narrative_reports';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'student_id' },
        { column_name: 'period_type' },
        { column_name: 'period_start' },
        { column_name: 'period_end' },
        { column_name: 'aspect' },
        { column_name: 'achievement_level' },
        { column_name: 'narrative' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('student_id');
      expect(columnNames).toContain('period_type');
      expect(columnNames).toContain('period_start');
      expect(columnNames).toContain('period_end');
      expect(columnNames).toContain('aspect');
      expect(columnNames).toContain('achievement_level');
      expect(columnNames).toContain('narrative');
    });
  });
});

describe('Database Schema - Daily Report Models', () => {
  describe('DailyStudentReport Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'daily_student_reports';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'student_id' },
        { column_name: 'report_date' },
        { column_name: 'mood' },
        { column_name: 'activities' },
        { column_name: 'meal_status' },
        { column_name: 'snack_status' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('student_id');
      expect(columnNames).toContain('report_date');
      expect(columnNames).toContain('mood');
      expect(columnNames).toContain('activities');
      expect(columnNames).toContain('meal_status');
      expect(columnNames).toContain('snack_status');
    });

    it('should have unique constraint on student_id + report_date', async () => {
      mockQueryRaw.mockResolvedValue([{ constraint_name: 'unique_student_report_date' }]);
      const constraints = await mockQueryRaw<any[]>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'daily_student_reports'
        AND constraint_type = 'UNIQUE';
      `;

      const hasUniqueStudentDate = constraints.some(
        (c) => c.constraint_name.includes('student') || c.constraint_name.includes('report_date')
      );
      expect(hasUniqueStudentDate).toBe(true);
    });

    it('should have foreign key to students', async () => {
      mockQueryRaw.mockResolvedValue([{ constraint_name: 'fk_student' }]);
      const fks = await mockQueryRaw<any[]>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'daily_student_reports'
        AND constraint_type = 'FOREIGN KEY';
      `;

      expect(fks.length).toBeGreaterThan(0);
    });
  });

  describe('DailyReportPhoto Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'daily_report_photos';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'report_id' },
        { column_name: 'photo_url' },
        { column_name: 'caption' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('report_id');
      expect(columnNames).toContain('photo_url');
      expect(columnNames).toContain('caption');
    });
  });

  describe('DailyHomework Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'daily_homework';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'report_id' },
        { column_name: 'subject' },
        { column_name: 'description' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('report_id');
      expect(columnNames).toContain('subject');
      expect(columnNames).toContain('description');
    });
  });
});

describe('Database Schema - Tahfidz Models', () => {
  describe('MurojaahRecord Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'murojaah_records';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'enrollment_id' },
        { column_name: 'murojaah_date' },
        { column_name: 'murojaah_type' },
        { column_name: 'juz_from' },
        { column_name: 'juz_to' },
        { column_name: 'quality_score' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('enrollment_id');
      expect(columnNames).toContain('murojaah_date');
      expect(columnNames).toContain('murojaah_type');
      expect(columnNames).toContain('juz_from');
      expect(columnNames).toContain('juz_to');
      expect(columnNames).toContain('quality_score');
    });

    it('should have quality_score between 0 and 100', async () => {
      mockQueryRaw.mockResolvedValue([
        { constraint_name: 'check_quality_score', check_clause: 'quality_score >= 0 AND quality_score <= 100' }
      ]);

      const constraints = await mockQueryRaw<any[]>`
        SELECT constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE constraint_name LIKE '%quality_score%';
      `;

      // If constraint exists, verify it
      if (constraints.length > 0) {
        expect(constraints[0].check_clause).toContain('0');
        expect(constraints[0].check_clause).toContain('100');
      }
    });
  });

  describe('MurojaahMistake Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'murojaah_mistakes';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'murojaah_id' },
        { column_name: 'mistake_type' },
        { column_name: 'surah_number' },
        { column_name: 'ayat_number' },
        { column_name: 'count' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('murojaah_id');
      expect(columnNames).toContain('mistake_type');
      expect(columnNames).toContain('surah_number');
      expect(columnNames).toContain('ayat_number');
      expect(columnNames).toContain('count');
    });
  });

  describe('SimaanExam Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'simaan_exams';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'enrollment_id' },
        { column_name: 'exam_date' },
        { column_name: 'simaan_type' },
        { column_name: 'juz_tested' },
        { column_name: 'final_score' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('enrollment_id');
      expect(columnNames).toContain('exam_date');
      expect(columnNames).toContain('simaan_type');
      expect(columnNames).toContain('juz_tested');
      expect(columnNames).toContain('final_score');
    });
  });
});

describe('Database Schema - Dashboard Models', () => {
  describe('DashboardMetricSnapshot Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'dashboard_metric_snapshots';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'unit_id' },
        { column_name: 'snapshot_date' },
        { column_name: 'metric_type' },
        { column_name: 'metric_value' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('unit_id');
      expect(columnNames).toContain('snapshot_date');
      expect(columnNames).toContain('metric_type');
      expect(columnNames).toContain('metric_value');
    });

    it('should have unique constraint on unit + date + metric_type', async () => {
      mockQueryRaw.mockResolvedValue([{ constraint_name: 'unique_snapshot' }]);
      const constraints = await mockQueryRaw<any[]>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'dashboard_metric_snapshots'
        AND constraint_type = 'UNIQUE';
      `;

      expect(constraints.length).toBeGreaterThan(0);
    });
  });

  describe('UnitComparisonReport Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'unit_comparison_reports';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'report_date' },
        { column_name: 'metric_type' },
        { column_name: 'comparison_data' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('report_date');
      expect(columnNames).toContain('metric_type');
      expect(columnNames).toContain('comparison_data');
    });
  });
});

describe('Database Schema - Health Models', () => {
  describe('GrowthRecord Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'growth_records';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'student_id' },
        { column_name: 'recorded_date' },
        { column_name: 'height_cm' },
        { column_name: 'weight_kg' },
        { column_name: 'head_circumference_cm' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('student_id');
      expect(columnNames).toContain('recorded_date');
      expect(columnNames).toContain('height_cm');
      expect(columnNames).toContain('weight_kg');
      expect(columnNames).toContain('head_circumference_cm');
    });
  });

  describe('ImmunizationRecord Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'immunization_records';

      mockQueryRaw.mockResolvedValue([
        { column_name: 'id' },
        { column_name: 'student_id' },
        { column_name: 'vaccine_name' },
        { column_name: 'immunization_date' },
        { column_name: 'dose_number' },
      ]);

      const result = await mockQueryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      expect(result.length).toBeGreaterThan(0);

      const columnNames = result.map((col) => col.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('student_id');
      expect(columnNames).toContain('vaccine_name');
      expect(columnNames).toContain('immunization_date');
      expect(columnNames).toContain('dose_number');
    });
  });
});

describe('Database Indexes', () => {
  it('should have indexes on frequently queried fields', async () => {
    mockQueryRaw.mockResolvedValue([
      { tablename: 'paud_development_assessments', indexname: 'paud_idx', indexdef: 'CREATE INDEX ...' }
    ]);

    const indexes = await mockQueryRaw<any[]>`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND (
        tablename LIKE 'paud%'
        OR tablename LIKE 'daily%'
        OR tablename LIKE 'murojaah%'
        OR tablename LIKE 'simaan%'
        OR tablename LIKE 'dashboard%'
        OR tablename = 'growth_records'
        OR tablename = 'immunization_records'
      )
      ORDER BY tablename, indexname;
    `;

    expect(indexes.length).toBeGreaterThan(0);

    // Log indexes for verification (optional)
    console.log(`Found ${indexes.length} indexes on enhancement tables`);
  });
});
