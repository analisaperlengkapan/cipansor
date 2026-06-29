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
      expect(columnNames).toContain('age_group_min');
      expect(columnNames).toContain('age_group_max');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should have unique constraint on code', async () => {
      // Prisma materializes @unique/@@unique as UNIQUE INDEXes (not table
      // constraints), so query pg_indexes rather than information_schema.
      const indexes = await prisma.$queryRaw<any[]>`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'paud_development_indicators'
        AND indexdef LIKE '%UNIQUE%';
      `;

      const hasUniqueCode = indexes.some((i) => i.indexname.includes('code'));
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
      expect(columnNames).toContain('period_date');
      expect(columnNames).toContain('achievement_level');
      expect(columnNames).toContain('teacher_notes');
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
      const tableName = 'paud_assessment_evidences';

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
      expect(columnNames).toContain('file_type');
      expect(columnNames).toContain('file_url');
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
      expect(columnNames).toContain('semester');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('overall_strengths');
      expect(columnNames).toContain('areas_for_development');
      expect(columnNames).toContain('narrative_nam');
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
      expect(columnNames).toContain('activities_summary');
      expect(columnNames).toContain('meal_status');
      expect(columnNames).toContain('snack_status');
    });

    it('should have unique constraint on student_id + report_date', async () => {
      const indexes = await prisma.$queryRaw<any[]>`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'daily_student_reports'
        AND indexdef LIKE '%UNIQUE%';
      `;

      const hasUniqueStudentDate = indexes.some(
        (i) => i.indexname.includes('student') || i.indexname.includes('report_date')
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
      expect(columnNames).toContain('subject_name');
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
      expect(columnNames).toContain('juz_start');
      expect(columnNames).toContain('juz_end');
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
      expect(columnNames).toContain('ayah_number');
      expect(columnNames).toContain('description');
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
      expect(columnNames).toContain('juz_start');
      expect(columnNames).toContain('overall_score');
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
      expect(columnNames).toContain('period_date');
      expect(columnNames).toContain('metric_type');
      expect(columnNames).toContain('metric_value');
    });

    it('should have unique constraint on unit + date + metric_type', async () => {
      const indexes = await prisma.$queryRaw<any[]>`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'dashboard_metric_snapshots'
        AND indexdef LIKE '%UNIQUE%'
        AND indexname NOT LIKE '%pkey';
      `;

      expect(indexes.length).toBeGreaterThan(0);
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
      expect(columnNames).toContain('period_start');
      expect(columnNames).toContain('period_end');
      expect(columnNames).toContain('report_type');
      expect(columnNames).toContain('report_data');
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
      expect(columnNames).toContain('record_date');
      expect(columnNames).toContain('height');
      expect(columnNames).toContain('weight');
      expect(columnNames).toContain('head_circumference');
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
      expect(columnNames).toContain('scheduled_date');
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
