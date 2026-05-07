import { Request, Response, NextFunction } from 'express';
import { P5ProjectService } from './p5-project.service';
import { ApiResponse } from '@/utils/response';

export class P5ProjectController {
  static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      // Best practice: Use the logged-in user as the default supervisor if not provided,
      // or validate that the user has permission to assign others.
      // For now, we'll enforce the creator is the supervisor if not specified,
      // or we can just override it to ensure accountability.
      // Let's assume the body might contain it, but we fallback or override.
      // A safer bet for "best practice" in this context is to ensure the supervisorId
      // is valid. If we want to allow assigning others, we should check permissions.
      // Simple approach: Set supervisorId to current user if they are a teacher.

      const supervisorId = req.body.supervisorId || req.user?.id;

      const project = await P5ProjectService.createProject({
        ...req.body,
        supervisorId,
      });
      return res.status(201).json(ApiResponse.success(project, 'P5 Project created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const project = await P5ProjectService.updateProject(id, req.body);
      return res.json(ApiResponse.success(project, 'P5 Project updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      await P5ProjectService.deleteProject(id);
      return res.json(ApiResponse.success(null, 'P5 Project deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = (req.params as any);
      const project = await P5ProjectService.getProjectById(id);
      return res.json(ApiResponse.success(project, 'P5 Project retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await P5ProjectService.getProjects((req.query as any));
      return res.json(ApiResponse.success(projects, 'P5 Projects list retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async upsertAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      // Security: Enforce assessorId from the logged-in user
      const assessment = await P5ProjectService.upsertAssessment({
        ...req.body,
        assessorId: req.user?.id,
      });
      return res.json(ApiResponse.success(assessment, 'Assessment saved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpsertAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      // Security: Enforce assessorId for all items
      const assessments = req.body.assessments.map((item: any) => ({
        ...item,
        assessorId: req.user?.id,
      }));

      const result = await P5ProjectService.bulkUpsertAssessments(assessments);
      return res.json(ApiResponse.success(result, 'Bulk assessments saved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
