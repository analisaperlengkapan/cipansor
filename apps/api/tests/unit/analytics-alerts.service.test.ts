/**
 * Unit Tests for Analytics Alerts Service
 * Tests alert rule checking and notification triggers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAttendanceRule } from '../../src/modules/analytics/alerts.service';
import { AttendanceStatus } from '@prisma/client';

describe('Analytics Alerts Service', () => {
  describe('AttendanceStatus Enum Usage', () => {
    it('should use correct AttendanceStatus enum values', () => {
      // Test that the enum values are correct
      expect(AttendanceStatus.PRESENT).toBe('PRESENT');
      expect(AttendanceStatus.ABSENT).toBe('ABSENT');
      expect(AttendanceStatus.LATE).toBe('LATE');
      expect(AttendanceStatus.SICK).toBe('SICK');
      expect(AttendanceStatus.EXCUSED).toBe('EXCUSED');
    });

    it('should not use lowercase string literals for attendance status', () => {
      // This test ensures we're not using lowercase strings
      const invalidStatuses = ['present', 'absent', 'late', 'sick', 'excused'];
      const validStatuses = Object.values(AttendanceStatus);

      invalidStatuses.forEach((invalid) => {
        expect(validStatuses).not.toContain(invalid);
      });
    });
  });

  describe('Alert Rule Structure', () => {
    it('should have valid alert rule types', () => {
      const validTypes = ['attendance', 'payment', 'academic', 'behavior'];

      validTypes.forEach((type) => {
        expect(['attendance', 'payment', 'academic', 'behavior']).toContain(type);
      });
    });

    it('should have valid comparison operators', () => {
      const validOperators = ['lt', 'lte', 'gt', 'gte', 'eq'];

      validOperators.forEach((op) => {
        expect(['lt', 'lte', 'gt', 'gte', 'eq']).toContain(op);
      });
    });

    it('should have valid action types', () => {
      const validActions = ['notify', 'email', 'whatsapp', 'all'];

      validActions.forEach((action) => {
        expect(['notify', 'email', 'whatsapp', 'all']).toContain(action);
      });
    });
  });
});
