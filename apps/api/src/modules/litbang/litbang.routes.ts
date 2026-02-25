import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth";
import * as controller from "./litbang.controller";

const router = Router();

// Summary
router.get("/summary", authenticate, controller.getSummary);

// Research Projects
router.get("/projects", authenticate, controller.getProjects);
router.get("/projects/:id", authenticate, controller.getProject);
router.post("/projects", authenticate, authorize("UNIT_ADMIN", "SUPER_ADMIN", "TEACHER", "STAFF"), controller.createProject);
router.put("/projects/:id", authenticate, authorize("UNIT_ADMIN", "SUPER_ADMIN", "TEACHER", "STAFF"), controller.updateProject);
router.delete("/projects/:id", authenticate, authorize("UNIT_ADMIN", "SUPER_ADMIN"), controller.deleteProject);

// Milestones
router.post("/milestones", authenticate, controller.createMilestone);
router.put("/milestones/:id", authenticate, controller.updateMilestone);
router.delete("/milestones/:id", authenticate, controller.deleteMilestone);

// Innovation Proposals
router.get("/proposals", authenticate, controller.getProposals);
router.get("/proposals/:id", authenticate, controller.getProposal);
router.post("/proposals", authenticate, controller.createProposal);
router.put("/proposals/:id", authenticate, controller.updateProposal);
router.post("/proposals/:id/evaluate", authenticate, authorize("UNIT_ADMIN", "SUPER_ADMIN"), controller.evaluateProposal);
router.delete("/proposals/:id", authenticate, authorize("UNIT_ADMIN", "SUPER_ADMIN"), controller.deleteProposal);

export default router;
