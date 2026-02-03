import { prisma } from '@/lib/prisma';
import { InnovationStatus, InnovationType, ProjectStatus, TaskPriority } from '@prisma/client';
import { CreateProposalInput, UpdateProposalInput, CreateReviewInput, CreateCommentInput } from './schema';
import { createProject } from '../project/service';

export async function createProposal(data: CreateProposalInput, userId: string) {
  return prisma.innovationProposal.create({
    data: {
      ...data,
      title: data.title,
      description: data.description || '',
      type: data.type || InnovationType.OTHER,
      submittedBy: { connect: { id: userId } },
      status: InnovationStatus.DRAFT,
    },
  });
}

export async function getProposals(query: { status?: InnovationStatus; type?: InnovationType; userId?: string }) {
  return prisma.innovationProposal.findMany({
    where: {
      ...(query.status && { status: query.status }),
      ...(query.type && { type: query.type }),
      ...(query.userId && { submittedById: query.userId }),
    },
    include: {
      submittedBy: { select: { id: true, name: true } },
      _count: { select: { reviews: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProposalById(id: string) {
  return prisma.innovationProposal.findUnique({
    where: { id },
    include: {
      submittedBy: { select: { id: true, name: true, email: true } },
      reviews: {
        include: {
          reviewer: { select: { id: true, name: true } },
        },
      },
      comments: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      project: { select: { id: true, name: true, status: true } },
    },
  });
}

export async function updateProposal(id: string, data: UpdateProposalInput) {
  return prisma.innovationProposal.update({
    where: { id },
    data,
  });
}

export async function submitProposal(id: string) {
  return prisma.innovationProposal.update({
    where: { id },
    data: { status: InnovationStatus.SUBMITTED },
  });
}

export async function addReview(proposalId: string, reviewerId: string, data: CreateReviewInput) {
  return prisma.innovationReview.create({
    data: {
      proposal: { connect: { id: proposalId } },
      reviewer: { connect: { id: reviewerId } },
      status: data.status || 'PENDING',
      notes: data.notes,
      score: data.score || 0,
    },
  });
}

export async function addComment(proposalId: string, userId: string, data: CreateCommentInput) {
  return prisma.innovationComment.create({
    data: {
      proposal: { connect: { id: proposalId } },
      user: { connect: { id: userId } },
      content: data.content,
    },
  });
}

export async function approveProposal(id: string) {
  return prisma.$transaction(async (tx) => {
    const proposal = await tx.innovationProposal.findUnique({
      where: { id },
      include: { submittedBy: true }
    });

    if (!proposal) throw new Error('Proposal not found');
    if (proposal.status === InnovationStatus.APPROVED) throw new Error('Already approved');

    const unitId = proposal.submittedBy.unitId;
    if (!unitId) throw new Error('Submitter has no unit assigned');

    // Create Project
    const project = await createProject({
      name: proposal.title,
      description: proposal.description,
      status: ProjectStatus.PLANNING,
      priority: TaskPriority.MEDIUM,
      managerId: proposal.submittedById,
      unitId: unitId,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default 1 year
      budget: 0
    }, tx);

    // Update Proposal
    return tx.innovationProposal.update({
      where: { id },
      data: {
        status: InnovationStatus.APPROVED,
        projectId: project.id
      }
    });
  });
}

export async function rejectProposal(id: string) {
    return prisma.innovationProposal.update({
        where: { id },
        data: { status: InnovationStatus.REJECTED }
    });
}
