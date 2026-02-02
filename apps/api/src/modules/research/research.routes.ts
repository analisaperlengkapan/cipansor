import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate, validateQuery, validateParams } from '@/middleware/error';
import * as controller from './research.controller';
import {
  CreateResearchProposalSchema,
  UpdateResearchProposalSchema,
  CreateResearchOutputSchema,
  UpdateResearchOutputSchema,
  listResearchProposalsQuerySchema,
  listResearchOutputsQuerySchema,
  researchIdParamSchema
} from './research.schema';

const router = Router();

router.use(authenticate);

// --- Proposals ---

router.get(
  '/proposals',
  validateQuery(listResearchProposalsQuerySchema),
  controller.listProposals
);

router.post(
  '/proposals',
  validate(CreateResearchProposalSchema),
  controller.createProposal
);

router.get(
  '/proposals/:id',
  validateParams(researchIdParamSchema),
  controller.getProposalById
);

router.put(
  '/proposals/:id',
  validateParams(researchIdParamSchema),
  validate(UpdateResearchProposalSchema),
  controller.updateProposal
);

router.delete(
  '/proposals/:id',
  validateParams(researchIdParamSchema),
  controller.deleteProposal
);

// --- Outputs ---

router.get(
  '/outputs',
  validateQuery(listResearchOutputsQuerySchema),
  controller.listOutputs
);

router.post(
  '/outputs',
  validate(CreateResearchOutputSchema),
  controller.createOutput
);

router.put(
  '/outputs/:id',
  validateParams(researchIdParamSchema),
  validate(UpdateResearchOutputSchema),
  controller.updateOutput
);

router.delete(
  '/outputs/:id',
  validateParams(researchIdParamSchema),
  controller.deleteOutput
);

export default router;
