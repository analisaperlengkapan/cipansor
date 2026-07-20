import { Request, Response, NextFunction } from 'express';
import { Errors } from '../../middleware/error';
import * as service from './service';
import {
  createProjectSchema,
  updateProjectSchema,
  createProjectTaskSchema,
  updateProjectTaskSchema,
  updateTaskPositionSchema,
  createColumnSchema,
  updateColumnSchema,
} from './schema';
import { ProjectStatus } from '@prisma/client';

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProjectSchema.parse(req);
    const unitId = data.body.unitId || req.user?.unitId;

    if (!unitId) {
      throw Errors.badRequest('Unit is required to create a project');
    }

    const project = await service.createProject({
      ...data.body,
      managerId: req.user!.sub,
      unitId: unitId,
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
}

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const filter = {
      unitId: req.user?.unitId ?? undefined,
      status: req.query.status as ProjectStatus,
    };
    const projects = await service.getProjects(filter);
    res.json(projects);
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params.id);
    if (!project) {
      throw Errors.notFound('Project not found');
    }
    if (project.unitId !== req.user?.unitId) {
      throw Errors.forbidden('Access denied');
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params.id);
    if (!project || project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Project not found');
    }
    const data = updateProjectSchema.parse(req);
    const updated = await service.updateProject(req.params.id, data.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params.id);
    if (!project || project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Project not found');
    }
    await service.deleteProject(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params.projectId);
    if (!project || project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Project not found');
    }
    const data = createProjectTaskSchema.parse(req);
    const task = await service.createTask(req.params.projectId, data.body, req.user!.sub);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await service.getTaskById(req.params.taskId);
    if (!task || task.project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Task not found');
    }

    const data = updateProjectTaskSchema.parse(req);
    const updatedTask = await service.updateTask(req.params.taskId, data.body, req.user!.sub);
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
}

export async function updateTaskPosition(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await service.getTaskById(req.params.taskId);
    if (!task || task.project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Task not found');
    }

    const data = updateTaskPositionSchema.parse(req);

    // Verify target column belongs to the same project
    if (data.body.columnId) {
      const column = await service.getColumnById(data.body.columnId);
      if (!column || column.projectId !== task.projectId) {
        throw Errors.badRequest('Invalid target column');
      }
    }

    const updatedTask = await service.updateTaskPosition(req.params.taskId, data.body);
    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await service.getTaskById(req.params.taskId);
    if (!task || task.project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Task not found');
    }

    await service.deleteTask(req.params.taskId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function createColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await service.getProjectById(req.params.projectId);
    if (!project || project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Project not found');
    }

    const data = createColumnSchema.parse(req);
    const column = await service.createColumn(req.params.projectId, data.body);
    res.status(201).json(column);
  } catch (error) {
    next(error);
  }
}

export async function updateColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const column = await service.getColumnById(req.params.columnId);
    if (!column || column.project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Column not found');
    }

    const data = updateColumnSchema.parse(req);
    const updatedColumn = await service.updateColumn(req.params.columnId, data.body);
    res.json(updatedColumn);
  } catch (error) {
    next(error);
  }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction) {
  try {
    const column = await service.getColumnById(req.params.columnId);
    if (!column || column.project.unitId !== req.user?.unitId) {
      throw Errors.notFound('Column not found');
    }

    await service.deleteColumn(req.params.columnId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
