import { Request, Response, NextFunction } from 'express';
import * as innovationService from './service';
import { InnovationStatus, InnovationType } from '@prisma/client';

export async function createProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await innovationService.createProposal(req.body, req.user!.id);
    res.status(201).json(proposal);
  } catch (error) {
    next(error);
  }
}

export async function getProposals(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, type, mine } = req.query;
    const userId = mine === 'true' ? req.user!.id : undefined;

    const proposals = await innovationService.getProposals({
      status: status as InnovationStatus,
      type: type as InnovationType,
      userId,
    });
    res.json(proposals);
  } catch (error) {
    next(error);
  }
}

export async function getProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await innovationService.getProposalById(req.params.id);
    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }
    res.json(proposal);
  } catch (error) {
    next(error);
  }
}

export async function updateProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await innovationService.updateProposal(req.params.id, req.body, req.user!.id);
    res.json(proposal);
  } catch (error) {
    next(error);
  }
}

export async function submitProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await innovationService.submitProposal(req.params.id);
    res.json(proposal);
  } catch (error) {
    next(error);
  }
}

export async function approveProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await innovationService.approveProposal(req.params.id);
    res.json(proposal);
  } catch (error) {
    next(error);
  }
}

export async function rejectProposal(req: Request, res: Response, next: NextFunction) {
  try {
    const proposal = await innovationService.rejectProposal(req.params.id);
    res.json(proposal);
  } catch (error) {
    next(error);
  }
}

export async function addReview(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await innovationService.addReview(req.params.id, req.user!.id, req.body);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const comment = await innovationService.addComment(req.params.id, req.user!.id, req.body);
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
}
