import { describe, it, expect, beforeEach, vi } from 'vitest';
import { complaintsService } from './complaints.service';
import { prisma } from '@/lib/prisma';
import { createNotification, createBulkNotifications } from '../notifications/service';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    complaint: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    complaintComment: {
      create: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../notifications/service', () => ({
  createNotification: vi.fn(),
  createBulkNotifications: vi.fn(),
}));

describe('ComplaintsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a complaint and notify admins', async () => {
      const mockData = {
        unitId: 'unit-1',
        userId: 'user-1',
        category: ComplaintCategory.ACADEMIC,
        subject: 'Test Complaint',
        description: 'Description',
        priority: ComplaintPriority.HIGH,
      };

      const mockComplaint = {
        id: 'complaint-1',
        ...mockData,
        status: ComplaintStatus.PENDING,
        isAnonymous: false,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAdmins = [{ id: 'admin-1' }, { id: 'admin-2' }];

      (prisma.complaint.create as any).mockResolvedValue(mockComplaint);
      (prisma.user.findMany as any).mockResolvedValue(mockAdmins);

      const result = await complaintsService.create(mockData);

      expect(prisma.complaint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subject: 'Test Complaint',
          priority: 'HIGH',
        }),
      });

      expect(createBulkNotifications).toHaveBeenCalledWith(expect.objectContaining({
        userIds: ['admin-1', 'admin-2'],
        title: 'Aduan Baru',
        priority: 'HIGH',
      }));

      expect(result).toEqual(mockComplaint);
    });
  });

  describe('updateStatus', () => {
    it('should update status and notify reporter', async () => {
      const complaintId = 'complaint-1';
      const status = ComplaintStatus.IN_PROGRESS;

      const mockComplaint = {
        id: complaintId,
        userId: 'user-1',
        subject: 'Test Complaint',
        status: status,
      };

      (prisma.complaint.update as any).mockResolvedValue(mockComplaint);

      const result = await complaintsService.updateStatus(complaintId, status);

      expect(prisma.complaint.update).toHaveBeenCalledWith({
        where: { id: complaintId },
        data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        include: { user: true },
      });

      expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        title: 'Update Status Aduan',
      }));

      expect(result).toEqual(mockComplaint);
    });
  });
});
