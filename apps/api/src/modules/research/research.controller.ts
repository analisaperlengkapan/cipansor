import { Request, Response, NextFunction } from 'express';
import { researchService } from './research.service';
import { NotFoundError } from '@/middleware/error';

// --- Proposals ---

export const createProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await researchService.createProposal(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

export const listProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await researchService.findAllProposals(req.query as any);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProposalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await researchService.findProposalById(req.params.id);
    if (!proposal) {
      throw new NotFoundError('Research proposal not found');
    }
    res.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await researchService.updateProposal(req.params.id, req.body);
    res.json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await researchService.deleteProposal(req.params.id);
    res.json({
      success: true,
      message: 'Research proposal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// --- Outputs ---

export const createOutput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const output = await researchService.createOutput(req.body, req.user!.id);
    res.status(201).json({
      success: true,
      data: output,
    });
  } catch (error) {
    next(error);
  }
};

export const listOutputs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await researchService.findAllOutputs(req.query as any);
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOutput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const output = await researchService.updateOutput(req.params.id, req.body);
    res.json({
      success: true,
      data: output,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOutput = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await researchService.deleteOutput(req.params.id);
    res.json({
      success: true,
      message: 'Research output deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
