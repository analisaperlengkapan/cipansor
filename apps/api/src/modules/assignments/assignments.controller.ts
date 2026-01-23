import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { assignmentsService } from './assignments.service';
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentRequest,
  GradeSubmissionRequest,
} from '@cipansor/shared';

export const assignmentsController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const input: CreateAssignmentRequest = req.body;
    const user = (req as any).user;

    if (user.role === 'TEACHER' && user.teacher?.id) {
      input.teacherId = user.teacher.id;
    }

    const assignment = await assignmentsService.create(input);
    res.status(201).json({ success: true, data: assignment });
  }),

  findAll: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const user = (req as any).user;

    if (user.role === 'STUDENT' && user.student?.id) {
      query.studentId = user.student.id;
    }

    const result = await assignmentsService.findAll(query);
    res.json({ success: true, data: result.data, meta: { pagination: result.meta } });
  }),

  findOne: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const assignment = await assignmentsService.findOne(id);
    res.json({ success: true, data: assignment });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const input: UpdateAssignmentRequest = req.body;
    const assignment = await assignmentsService.update(id, input);
    res.json({ success: true, data: assignment });
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await assignmentsService.delete(id);
    res.json({ success: true, message: 'Assignment deleted' });
  }),

  submit: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const input: SubmitAssignmentRequest = req.body;
    const user = (req as any).user;

    if (user.role === 'STUDENT' && user.student?.id) {
      input.studentId = user.student.id;
    }

    const submission = await assignmentsService.submit(id, input);
    res.json({ success: true, data: submission });
  }),

  getSubmissions: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const submissions = await assignmentsService.getSubmissions(id);
    res.json({ success: true, data: submissions });
  }),

  grade: asyncHandler(async (req: Request, res: Response) => {
    const { id, studentId } = req.params;
    const input: GradeSubmissionRequest = req.body;
    const submission = await assignmentsService.grade(id, studentId, input);
    res.json({ success: true, data: submission });
  }),
};
