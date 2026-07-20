import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './project.controller';

const router = Router();

router.use(authenticate);

// Projects
router.post('/', controller.createProject);
router.get('/', controller.getProjects);
router.get('/:id', controller.getProjectById);
router.patch('/:id', controller.updateProject);
router.delete('/:id', controller.deleteProject);

// Tasks
router.post('/:projectId/tasks', controller.createTask);
router.patch('/tasks/:taskId', controller.updateTask);
router.patch('/tasks/:taskId/position', controller.updateTaskPosition);
router.delete('/tasks/:taskId', controller.deleteTask);

// Columns
router.post('/:projectId/columns', controller.createColumn);
router.patch('/columns/:columnId', controller.updateColumn);
router.delete('/columns/:columnId', controller.deleteColumn);

export default router;
