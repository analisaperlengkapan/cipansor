import { Request, Response, NextFunction } from 'express';
import * as reportsService from './reports.service';
import { ApiResponse } from '@/utils/response';

// =====================================
// SKHUN (Surat Keterangan Hasil Ujian)
// =====================================

export async function getSkhun(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, academicYearId, examPeriod } = req.query;

    if (!studentId || !academicYearId) {
      return res
        .status(400)
        .json(ApiResponse.error('Student ID and Academic Year ID are required'));
    }

    const skhun = await reportsService.generateSkhun(
      studentId as string,
      academicYearId as string,
      (examPeriod as string) ?? 'UTAMA'
    );

    return res.json(ApiResponse.success(skhun, 'SKHUN generated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getSkhunByStudentId(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;
    const { academicYearId } = req.query;

    const skhun = await reportsService.getSkhunByStudent(
      studentId,
      academicYearId as string | undefined
    );

    if (!skhun) {
      return res.status(404).json(ApiResponse.error('SKHUN not found'));
    }

    return res.json(ApiResponse.success(skhun, 'SKHUN fetched successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getBulkSkhun(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId, academicYearId, examPeriod } = req.query;

    if (!classId || !academicYearId) {
      return res.status(400).json(ApiResponse.error('Class ID and Academic Year ID are required'));
    }

    const skhunList = await reportsService.generateBulkSkhun(
      classId as string,
      academicYearId as string,
      (examPeriod as string) ?? 'UTAMA'
    );

    return res.json(
      ApiResponse.success(
        { data: skhunList, total: skhunList.length },
        `SKHUN generated for ${skhunList.length} students`
      )
    );
  } catch (error) {
    next(error);
  }
}

// =====================================
// TRANSKRIP NILAI
// =====================================

export async function getTranscript(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;
    const { graduationYear } = req.query;

    const transcript = await reportsService.generateTranscript(
      studentId,
      graduationYear as string | undefined
    );

    return res.json(ApiResponse.success(transcript, 'Transcript generated successfully'));
  } catch (error) {
    next(error);
  }
}

export async function getBulkTranscripts(req: Request, res: Response, next: NextFunction) {
  try {
    const { classId } = req.query;

    if (!classId) {
      return res.status(400).json(ApiResponse.error('Class ID is required'));
    }

    const transcripts = await reportsService.generateBulkTranscripts(classId as string);

    return res.json(
      ApiResponse.success(
        { data: transcripts, total: transcripts.length },
        `Transcripts generated for ${transcripts.length} students`
      )
    );
  } catch (error) {
    next(error);
  }
}

// =====================================
// REPORT CARD PRINT
// =====================================

export async function getReportCardPrintData(req: Request, res: Response, next: NextFunction) {
  try {
    const { reportCardId } = req.params;

    const printData = await reportsService.getReportCardPrintData(reportCardId);

    return res.json(ApiResponse.success(printData, 'Report card print data fetched'));
  } catch (error) {
    next(error);
  }
}

// =====================================
// EXPORT FUNCTIONS
// =====================================

export async function exportSkhunExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId, academicYearId } = req.query;

    if (!studentId || !academicYearId) {
      return res
        .status(400)
        .json(ApiResponse.error('Student ID and Academic Year ID are required'));
    }

    const exportData = await reportsService.exportSkhunToExcel(
      studentId as string,
      academicYearId as string
    );

    return res.json(ApiResponse.success(exportData, 'SKHUN export data ready'));
  } catch (error) {
    next(error);
  }
}

export async function exportTranscriptExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;

    const exportData = await reportsService.exportTranscriptToExcel(studentId);

    return res.json(ApiResponse.success(exportData, 'Transcript export data ready'));
  } catch (error) {
    next(error);
  }
}
