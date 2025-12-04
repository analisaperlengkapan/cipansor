import { Request, Response, NextFunction } from 'express';
import * as accreditationService from './accreditation.service';
import { ApiResponse } from '@/utils/response';

// Get all 8 SNP standards
export async function getStandards(req: Request, res: Response, next: NextFunction) {
  try {
    const standards = await accreditationService.getAccreditationStandards();
    return res.json(ApiResponse.success(standards, 'Standards fetched successfully'));
  } catch (error) {
    next(error);
  }
}

// Get unit accreditation status and statistics
export async function getUnitStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.params;
    const status = await accreditationService.getUnitAccreditationStatus(unitId);
    return res.json(ApiResponse.success(status, 'Unit status fetched successfully'));
  } catch (error) {
    next(error);
  }
}

// Get accreditation dashboard with readiness scores
export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.params;
    const dashboard = await accreditationService.getAccreditationDashboard(unitId);
    return res.json(ApiResponse.success(dashboard, 'Dashboard fetched successfully'));
  } catch (error) {
    next(error);
  }
}

// Submit accreditation self-assessment
export async function submitAssessment(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId, academicYearId, assessments, assessmentDate } = req.body;
    const assessorId = req.user!.sub;
    
    const result = await accreditationService.createAccreditationAssessment({
      unitId,
      academicYearId,
      assessorId,
      assessmentDate: new Date(assessmentDate ?? Date.now()),
      assessments,
    });
    
    return res.status(201).json(
      ApiResponse.success(result, 'Assessment submitted successfully')
    );
  } catch (error) {
    next(error);
  }
}

// Simulate accreditation score
export async function simulateScore(req: Request, res: Response, next: NextFunction) {
  try {
    const { unitId } = req.params;
    const { scores } = req.body;
    
    const simulation = await accreditationService.simulateAccreditationScore(
      unitId,
      scores ?? {}
    );
    
    return res.json(ApiResponse.success(simulation, 'Simulation completed'));
  } catch (error) {
    next(error);
  }
}
