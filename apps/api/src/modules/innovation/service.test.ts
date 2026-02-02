import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as service from './service';
import { prisma } from '@/lib/prisma';
import { InnovationStatus, InnovationType } from '@prisma/client';
import { createProject } from '../project/service';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    innovationProposal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    innovationReview: {
      create: vi.fn(),
    },
    innovationComment: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../project/service', () => ({
  createProject: vi.fn(),
}));

describe('Innovation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a proposal', async () => {
    const input = {
      title: 'New Idea',
      description: 'A great idea description',
      type: InnovationType.PRODUCT,
    };
    const userId = 'user-1';

    (prisma.innovationProposal.create as any).mockResolvedValue({
      id: 'prop-1',
      ...input,
      submittedById: userId,
      status: InnovationStatus.DRAFT,
    });

    const result = await service.createProposal(input, userId);

    expect(prisma.innovationProposal.create).toHaveBeenCalledWith({
      data: {
        ...input,
        submittedById: userId,
        status: InnovationStatus.DRAFT,
      },
    });
    expect(result.id).toBe('prop-1');
  });

  it('should approve proposal and create project', async () => {
    const proposalId = 'prop-1';
    const mockProposal = {
      id: proposalId,
      title: 'New Idea',
      description: 'Desc',
      submittedById: 'user-1',
      status: InnovationStatus.SUBMITTED,
      submittedBy: { unitId: 'unit-1' },
    };

    (prisma.innovationProposal.findUnique as any).mockResolvedValue(mockProposal);
    (createProject as any).mockResolvedValue({ id: 'proj-1' });
    (prisma.innovationProposal.update as any).mockResolvedValue({ ...mockProposal, status: InnovationStatus.APPROVED, projectId: 'proj-1' });

    const result = await service.approveProposal(proposalId);

    expect(createProject).toHaveBeenCalledWith(expect.objectContaining({
      name: 'New Idea',
      unitId: 'unit-1',
    }));
    expect(prisma.innovationProposal.update).toHaveBeenCalledWith({
      where: { id: proposalId },
      data: { status: InnovationStatus.APPROVED, projectId: 'proj-1' },
    });
  });
});
