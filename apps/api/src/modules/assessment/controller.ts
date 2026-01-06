import { Request, Response, NextFunction } from 'express';
import * as assessmentService from './service';
import {
  createExamSchema,
  updateExamSchema,
  examQuerySchema,
  createGradeSchema,
  updateGradeSchema,
  bulkCreateGradesSchema,
  gradeQuerySchema,
  createReportCardSchema,
  updateReportCardSchema,
  reportCardQuerySchema,
} from './schema';
import {
  CreateExamInput,
  CreateGradeInput,
  BulkCreateGradesInput,
  CreateReportCardInput
} from '@cipansor/shared';

// =====================================
// EXAM CONTROLLERS
// =====================================

export async function getExams(req: Request, res: Response, next: NextFunction) {
  try {
    const query = examQuerySchema.parse(req.query);
    const result = await assessmentService.getExams(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getExamById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const exam = await assessmentService.getExamById(id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
}

export async function createExam(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createExamSchema.parse(req.body);
    const exam = await assessmentService.createExam(data as CreateExamInput);
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
}

export async function updateExam(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateExamSchema.parse(req.body);
    const exam = await assessmentService.updateExam(id, data);
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
}

export async function deleteExam(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await assessmentService.deleteExam(id);
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function updateExamStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const exam = await assessmentService.updateExamStatus(id, status);
    res.json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
}

// =====================================
// GRADE CONTROLLERS
// =====================================

export async function getGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const query = gradeQuerySchema.parse(req.query);
    const result = await assessmentService.getGrades(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getGradeById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const grade = await assessmentService.getGradeById(id);
    if (!grade) {
      return res.status(404).json({ success: false, error: 'Grade not found' });
    }
    res.json({ success: true, data: grade });
  } catch (error) {
    next(error);
  }
}

export async function createGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createGradeSchema.parse(req.body);
    const grade = await assessmentService.createGrade(data as CreateGradeInput);
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    next(error);
  }
}

export async function updateGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateGradeSchema.parse(req.body);
    const grade = await assessmentService.updateGrade(id, data);
    res.json({ success: true, data: grade });
  } catch (error) {
    next(error);
  }
}

export async function deleteGrade(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await assessmentService.deleteGrade(id);
    res.json({ success: true, message: 'Grade deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function bulkCreateGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bulkCreateGradesSchema.parse(req.body);
    const result = await assessmentService.bulkCreateGrades(data as BulkCreateGradesInput);
    res.status(201).json({ success: true, data: { count: result } });
  } catch (error) {
    next(error);
  }
}

export async function getStudentGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;
    const grades = await assessmentService.getStudentGrades(studentId, academicYearId as string | undefined);
    res.json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
}

export async function getExamGrades(req: Request, res: Response, next: NextFunction) {
  try {
    const { examId } = req.params;
    const grades = await assessmentService.getExamGrades(examId);
    res.json({ success: true, data: grades });
  } catch (error) {
    next(error);
  }
}

// =====================================
// REPORT CARD CONTROLLERS
// =====================================

export async function getReportCards(req: Request, res: Response, next: NextFunction) {
  try {
    const query = reportCardQuerySchema.parse(req.query);
    const result = await assessmentService.getReportCards(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getReportCardById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const reportCard = await assessmentService.getReportCardById(id);
    if (!reportCard) {
      return res.status(404).json({ success: false, error: 'Report card not found' });
    }
    res.json({ success: true, data: reportCard });
  } catch (error) {
    next(error);
  }
}

export async function createReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createReportCardSchema.parse(req.body);
    const reportCard = await assessmentService.createReportCard(data as CreateReportCardInput);
    res.status(201).json({ success: true, data: reportCard });
  } catch (error) {
    next(error);
  }
}

export async function updateReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateReportCardSchema.parse(req.body);
    const reportCard = await assessmentService.updateReportCard(id, data);
    res.json({ success: true, data: reportCard });
  } catch (error) {
    next(error);
  }
}

export async function deleteReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await assessmentService.deleteReportCard(id);
    res.json({ success: true, message: 'Report card deleted successfully' });
  } catch (error) {
    next(error);
  }
}

export async function generateReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, classId, academicYearId, semester } = req.body;

    if (studentId) {
      const reportCard = await assessmentService.generateReportCard(
        studentId,
        classId,
        academicYearId,
        parseInt(semester)
      );
      res.json({ success: true, data: reportCard });
    } else if (classId) {
      // Bulk generation for class
      const reportCards = await assessmentService.generateClassReportCards(
        classId,
        academicYearId,
        parseInt(semester)
      );
      res.json({ success: true, data: reportCards });
    } else {
      res.status(400).json({ success: false, error: 'Either studentId or classId is required' });
    }
  } catch (error) {
    next(error);
  }
}

export async function publishReportCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const reportCard = await assessmentService.publishReportCard(id);
    res.json({ success: true, data: reportCard });
  } catch (error) {
    next(error);
  }
}
