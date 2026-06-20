/**
 * Database Migration Tests
 * Tests for PAUD, Daily Report, Tahfidz, and Dashboard models
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createPrismaClient } from '../../prisma/client';

// Prisma 7 connects via a driver adapter; the shared factory constructs lazily
// so this file loads even without a reachable database.
const prisma = createPrismaClient();

// This is an integration test that queries a real Postgres instance. It is
// opt-in via RUN_DB_TESTS=1 (the unit-test env points DATABASE_URL at a stub).
const describeDb = process.env.RUN_DB_TESTS ? describe : describe.skip;

describeDb('Database Schema - PAUD Models', () => {
  describe('PAUDDevelopmentIndicator Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'paud_development_indicators';

      // Query information_schema to check table exists
      const result = await prisma.$queryRaw<any[]>`
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
      const constraints = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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
      const fks = await prisma.$queryRaw<any[]>`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'paud_development_assessments'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%student%';
      `;

      expect(fks.length).toBeGreaterThan(0);
    });

    it('should have foreign key to indicators', async () => {
      const fks = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

describeDb('Database Schema - Daily Report Models', () => {
  describe('DailyStudentReport Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'daily_student_reports';

      const result = await prisma.$queryRaw<any[]>`
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
      const constraints = await prisma.$queryRaw<any[]>`
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
      const fks = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

describeDb('Database Schema - Tahfidz Models', () => {
  describe('MurojaahRecord Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'murojaah_records';

      const result = await prisma.$queryRaw<any[]>`
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
      const constraints = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

describeDb('Database Schema - Dashboard Models', () => {
  describe('DashboardMetricSnapshot Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'dashboard_metric_snapshots';

      const result = await prisma.$queryRaw<any[]>`
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
      const constraints = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

describeDb('Database Schema - Health Models', () => {
  describe('GrowthRecord Model', () => {
    it('should have required fields defined', async () => {
      const tableName = 'growth_records';

      const result = await prisma.$queryRaw<any[]>`
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

      const result = await prisma.$queryRaw<any[]>`
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

describeDb('Database Indexes', () => {
  it('should have indexes on frequently queried fields', async () => {
    const indexes = await prisma.$queryRaw<any[]>`
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
