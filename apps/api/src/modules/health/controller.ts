import type { Request, Response, NextFunction } from 'express';
import * as service from './service';
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  queryMedicalRecordSchema,
  createMedicationSchema,
  updateMedicationSchema,
  queryMedicationSchema,
  createMedicationUsageSchema,
  queryMedicationUsageSchema,
  createGrowthRecordSchema,
  queryGrowthRecordSchema,
  createImmunizationRecordSchema,
  queryImmunizationRecordSchema,
} from './schema';
import { Errors } from '../../middleware/error';
import {
  MedicalRecordType,
  CreateMedicalRecordInput,
  CreateMedicationInput,
  CreateMedicationUsageInput,
} from '@cipansor/shared';
import { CreateImmunizationRecordInput } from './schema';

// ==================== MEDICAL RECORD ====================

export async function getMedicalRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryMedicalRecordSchema.parse(req.query);
    const result = await service.getMedicalRecords({
      ...query,
      // Pass optional status filter if present
      status: req.query.status as string,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getHealthSummary(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if user has unitId (e.g., from token)
    const unitId = (req.user as any)?.unitId;
    if (!unitId) {
      // If no unitId (e.g. Super Admin), might need to handle differently or return empty
      // For now, return empty or throw specific error.
      // Assuming most users have unitId or pass it.
      // If strict: throw Errors.badRequest('Unit context required');
      // For safety, return empty stats:
      return res.json({
        success: true,
        data: {
          medications: { total: 0, lowStock: 0, expired: 0 },
          thisMonthRecords: 0,
          recordsByType: [],
        },
      });
    }
    const stats = await service.getHealthStats(unitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// ==================== IMMUNIZATION RECORD ====================

export async function createImmunizationRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createImmunizationRecordSchema.parse(req.body);
    const record = await service.createImmunizationRecord(
      data as CreateImmunizationRecordInput,
      req.user!.sub
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function getImmunizationRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryImmunizationRecordSchema.parse(req.query);
    const result = await service.getImmunizationRecords(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// ==================== GROWTH RECORDS ====================

export async function createGrowthRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createGrowthRecordSchema.parse(req.body);
    const record = await service.createGrowthRecord(data, req.user!.sub);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function getGrowthRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryGrowthRecordSchema.parse(req.query);
    const result = await service.getGrowthRecords(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMedicalRecordById(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await service.getMedicalRecordById(req.params.id);
    if (!record) {
      throw Errors.notFound('Medical record not found');
    }
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function createMedicalRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMedicalRecordSchema.parse(req.body);
    const record = await service.createMedicalRecord(
      data as CreateMedicalRecordInput,
      req.user!.sub
    );
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function updateMedicalRecord(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMedicalRecordSchema.parse(req.body);
    const record = await service.updateMedicalRecord(req.params.id, data);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
}

export async function deleteMedicalRecord(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteMedicalRecord(req.params.id);
    res.json({ success: true, message: 'Medical record deleted' });
  } catch (error) {
    next(error);
  }
}

export async function getStudentMedicalHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await service.getStudentMedicalHistory(req.params.studentId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}

// ==================== MEDICATION ====================

export async function getMedications(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryMedicationSchema.parse(req.query);
    const result = await service.getMedications(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMedicationById(req: Request, res: Response, next: NextFunction) {
  try {
    const medication = await service.getMedicationById(req.params.id);
    if (!medication) {
      throw Errors.notFound('Medication not found');
    }
    res.json({ success: true, data: medication });
  } catch (error) {
    next(error);
  }
}

export async function createMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMedicationSchema.parse(req.body);
    const medication = await service.createMedication(data as CreateMedicationInput);
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    next(error);
  }
}

export async function updateMedication(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMedicationSchema.parse(req.body);
    const medication = await service.updateMedication(req.params.id, data);
    res.json({ success: true, data: medication });
  } catch (error) {
    next(error);
  }
}

export async function deleteMedication(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteMedication(req.params.id);
    res.json({ success: true, message: 'Medication deleted' });
  } catch (error) {
    next(error);
  }
}

export async function addMedicationStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      throw Errors.badRequest('Quantity must be positive');
    }
    const medication = await service.addMedicationStock(req.params.id, quantity);
    res.json({ success: true, data: medication });
  } catch (error) {
    next(error);
  }
}

// ==================== MEDICATION USAGE ====================

export async function getMedicationUsageLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryMedicationUsageSchema.parse(req.query);
    const result = await service.getMedicationUsageLogs(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createMedicationUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMedicationUsageSchema.parse(req.body);
    const usage = await service.createMedicationUsage(
      data as CreateMedicationUsageInput,
      req.user!.sub
    );
    res.status(201).json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
}

// ==================== STATISTICS ====================

export async function getHealthStats(req: Request, res: Response, next: NextFunction) {
  try {
    const unitId = req.params.unitId;
    const stats = await service.getHealthStats(unitId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
