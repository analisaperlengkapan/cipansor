import { Request, Response, NextFunction } from "express";
import { litbangService } from "./litbang.service";

// ── Research Projects ───────────────────────────────
export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getProjects(req.query as any);
    res.json({ data });
  } catch (error) { next(error); }
};

export const getResearchSOPImpact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getResearchSOPImpact();
    res.json({ data });
  } catch (error) { next(error); }
};

export const getProjectFinancialStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getProjectFinancialStatus((req.params as any).id);
    res.json({ data });
  } catch (error) { next(error); }
};

export const getProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getProject((req.params as any).id);
    res.json({ data });
  } catch (error) { next(error); }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.createProject({
      ...req.body,
      leaderId: req.body.leaderId || req.user?.id,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.status(201).json({ data });
  } catch (error) { next(error); }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.updateProject((req.params as any).id, {
      ...req.body,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
    });
    res.json({ data });
  } catch (error) { next(error); }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await litbangService.deleteProject((req.params as any).id);
    res.status(204).send();
  } catch (error) { next(error); }
};

// ── Milestones ──────────────────────────────────────
export const createMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.createMilestone({
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
    });
    res.status(201).json({ data });
  } catch (error) { next(error); }
};

export const updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.updateMilestone((req.params as any).id, {
      ...req.body,
      dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
    });
    res.json({ data });
  } catch (error) { next(error); }
};

export const deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await litbangService.deleteMilestone((req.params as any).id);
    res.status(204).send();
  } catch (error) { next(error); }
};

// ── Innovation Proposals ────────────────────────────
export const getProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getProposals(req.query as any);
    res.json({ data });
  } catch (error) { next(error); }
};

export const getProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getProposal((req.params as any).id);
    res.json({ data });
  } catch (error) { next(error); }
};

export const createProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.createProposal({
      ...req.body,
      proposerId: req.body.proposerId || req.user?.id,
    });
    res.status(201).json({ data });
  } catch (error) { next(error); }
};

export const updateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.updateProposal((req.params as any).id, req.body);
    res.json({ data });
  } catch (error) { next(error); }
};

export const evaluateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.evaluateProposal(
      (req.params as any).id,
      req.user!.id,
      req.body.score,
      req.body.feedback
    );
    res.json({ data });
  } catch (error) { next(error); }
};

export const promoteProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.promoteProposal((req.params as any).id, req.body);
    res.json({ data });
  } catch (error) { next(error); }
};

export const deleteProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await litbangService.deleteProposal((req.params as any).id);
    res.status(204).send();
  } catch (error) { next(error); }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await litbangService.getSummary(req.query.unitId as string);
    res.json({ data });
  } catch (error) { next(error); }
};
