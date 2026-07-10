import { Request, Response } from 'express';
import { higherEducationService } from './higher-education.service';
import {
  CreateFacultySchema,
  CreateStudyProgramSchema,
  CreateCourseSchema,
  EnrollStudentSchema,
  CreateKRSSchema,
  AddCourseToKRSSchema
} from './higher-education.schema';

export class HigherEducationController {
  async createFaculty(req: Request, res: Response) {
    const data = CreateFacultySchema.parse(req.body);
    const unitId = req.params.unitId;
    const faculty = await higherEducationService.createFaculty({ ...data, unitId });
    res.status(201).json(faculty);
  }

  async getFaculties(req: Request, res: Response) {
    const faculties = await higherEducationService.getFaculties(req.params.unitId);
    res.json(faculties);
  }

  async createStudyProgram(req: Request, res: Response) {
    const data = CreateStudyProgramSchema.parse(req.body);
    const program = await higherEducationService.createStudyProgram(data);
    res.status(201).json(program);
  }

  async createCourse(req: Request, res: Response) {
    const data = CreateCourseSchema.parse(req.body);
    const course = await higherEducationService.createCourse(data);
    res.status(201).json(course);
  }

  async enrollStudent(req: Request, res: Response) {
    const data = EnrollStudentSchema.parse(req.body);
    const enrollment = await higherEducationService.enrollStudent(data);
    res.status(201).json(enrollment);
  }

  async createKrs(req: Request, res: Response) {
    const data = CreateKRSSchema.parse(req.body);
    const krs = await higherEducationService.createKrs(data);
    res.status(201).json(krs);
  }

  async addCourseToKrs(req: Request, res: Response) {
    const data = AddCourseToKRSSchema.parse(req.body);
    const enrollment = await higherEducationService.addCourseToKrs(data.krsId, data.classId);
    res.status(201).json(enrollment);
  }

  async getTranscript(req: Request, res: Response) {
    const transcript = await higherEducationService.getStudentTranscript(req.params.studentHeId);
    res.json(transcript);
  }
}

export const higherEducationController = new HigherEducationController();
