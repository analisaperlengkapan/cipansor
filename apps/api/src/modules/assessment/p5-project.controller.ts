import { Request, Response, NextFunction } from 'express';
import { P5ProjectService } from './p5-project.service';
import { ApiResponse } from '@/utils/response';

export class P5ProjectController {
  static async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await P5ProjectService.createProject(req.body);
      return res.status(201).json(ApiResponse.success(project, 'P5 Project created successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await P5ProjectService.updateProject(id, req.body);
      return res.json(ApiResponse.success(project, 'P5 Project updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await P5ProjectService.deleteProject(id);
      return res.json(ApiResponse.success(null, 'P5 Project deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const project = await P5ProjectService.getProjectById(id);
      return res.json(ApiResponse.success(project, 'P5 Project retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await P5ProjectService.getProjects(req.query);
      return res.json(ApiResponse.success(projects, 'P5 Projects list retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async upsertAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const assessment = await P5ProjectService.upsertAssessment(req.body);
      return res.json(ApiResponse.success(assessment, 'Assessment saved successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpsertAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await P5ProjectService.bulkUpsertAssessments(req.body.assessments);
      return res.json(ApiResponse.success(result, 'Bulk assessments saved successfully'));
    } catch (error) {
      next(error);
    }
  }
}
