import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InnovationStatus, InnovationType, ProjectStatus, TaskPriority } from '@prisma/client';

// Create mock functions and hoist them
const { mockInnovationProposal, mockInnovationReview, mockInnovationComment, mockProject, mockProjectColumn } = vi.hoisted(() => {
  return {
    mockInnovationProposal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    mockInnovationReview: {
      create: vi.fn(),
    },
    mockInnovationComment: {
      create: vi.fn(),
    },
    mockProject: {
      create: vi.fn(),
    },
    mockProjectColumn: {
      createMany: vi.fn(),
    },
  };
});

// Mock the Prisma Client constructor
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
        innovationProposal = mockInnovationProposal;
        innovationReview = mockInnovationReview;
        innovationComment = mockInnovationComment;
        project = mockProject;
        projectColumn = mockProjectColumn;
        $transaction = vi.fn((callback) =>
            callback({
                innovationProposal: mockInnovationProposal,
                innovationReview: mockInnovationReview,
                innovationComment: mockInnovationComment,
                project: mockProject,
                projectColumn: mockProjectColumn,
            })
        );
    },
    InnovationStatus: {
        DRAFT: 'DRAFT',
        SUBMITTED: 'SUBMITTED',
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED'
    },
    InnovationType: {
        OTHER: 'OTHER'
    },
    ProjectStatus: {
        PLANNING: 'PLANNING'
    },
    TaskPriority: {
        MEDIUM: 'MEDIUM'
    }
  };
});

// Mock the prisma singleton to use our mocks
vi.mock('@/lib/prisma', () => {
  return {
    prisma: {
        innovationProposal: mockInnovationProposal,
        innovationReview: mockInnovationReview,
        innovationComment: mockInnovationComment,
        project: mockProject,
        projectColumn: mockProjectColumn,
        $transaction: vi.fn((callback) =>
            callback({
                innovationProposal: mockInnovationProposal,
                innovationReview: mockInnovationReview,
                innovationComment: mockInnovationComment,
                project: mockProject,
                projectColumn: mockProjectColumn,
            })
        ),
    },
  };
});

// Mock project service since innovation service imports it
// We remove the mock here because we want to test the integration or at least rely on prisma mock
// If we want to mock createProject, we should ensure the path is correct.
// However, since we fixed the prisma mock, let's try allowing the real createProject to run
// which calls our mocked prisma.

import * as service from '../../../../src/modules/innovation/service';

describe('Innovation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProposal', () => {
    it('should create a proposal with DRAFT status', async () => {
      const input = {
        title: 'New Idea',
        description: 'Description',
        type: 'OTHER' as InnovationType,
      };
      const userId = 'user-1';

      const mockCreated = {
        id: '1',
        ...input,
        submittedById: userId,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInnovationProposal.create.mockResolvedValue(mockCreated);

      const result = await service.createProposal(input, userId);

      expect(result).toEqual(mockCreated);
      expect(mockInnovationProposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: input.title,
          description: input.description,
          type: input.type,
          submittedBy: { connect: { id: userId } },
          status: 'DRAFT',
        }),
      });
    });
  });

  describe('getProposals', () => {
    it('should return proposals based on filters', async () => {
      const query = { status: 'SUBMITTED' as InnovationStatus };
      const mockProposals = [{ id: '1', title: 'Test' }];

      mockInnovationProposal.findMany.mockResolvedValue(mockProposals);

      const result = await service.getProposals(query);

      expect(result).toEqual(mockProposals);
      expect(mockInnovationProposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SUBMITTED',
          }),
        })
      );
    });
  });

  describe('approveProposal', () => {
      it('should approve proposal and create project', async () => {
          const proposalId = '1';
          const proposal = {
              id: proposalId,
              title: 'Approved Idea',
              description: 'Desc',
              status: 'SUBMITTED',
              submittedById: 'user-1',
              submittedBy: { unitId: 'unit-1' }
          };

          const project = { id: 'proj-1', name: 'Approved Idea' };
          const updatedProposal = { ...proposal, status: 'APPROVED', projectId: project.id };

          mockInnovationProposal.findUnique.mockResolvedValue(proposal);
          mockProject.create.mockResolvedValue(project);
          mockInnovationProposal.update.mockResolvedValue(updatedProposal);

          const result = await service.approveProposal(proposalId);

          expect(result).toEqual(updatedProposal);
          expect(mockProject.create).toHaveBeenCalledWith(expect.objectContaining({
              data: expect.objectContaining({
                  name: proposal.title,
                  unit: { connect: { id: proposal.submittedBy.unitId } }
              })
          }));
          expect(mockInnovationProposal.update).toHaveBeenCalledWith({
              where: { id: proposalId },
              data: {
                  status: 'APPROVED',
                  projectId: project.id
              }
          });
      });
  });
});
