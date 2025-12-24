import { Request, Response, NextFunction } from "express";
import * as service from "./service";
import {
  createAdmissionPeriodSchema,
  updateAdmissionPeriodSchema,
  createRegistrantSchema,
  updateRegistrantSchema,
  updateRegistrantScoreSchema,
  updateRegistrantStatusSchema,
  createRegistrantDocumentSchema,
  verifyDocumentSchema,
} from "./schema";
import { Errors } from "../../middleware/error";
import { z } from "zod";

// =====================================
// ADMISSION PERIOD CONTROLLERS
// =====================================

export async function getAdmissionPeriods(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getAdmissionPeriods(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAdmissionPeriodById(req: Request, res: Response, next: NextFunction) {
  try {
    const period = await service.getAdmissionPeriodById(req.params.id);
    if (!period) {
      throw Errors.notFound("Admission period not found");
    }
    res.json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

export async function createAdmissionPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createAdmissionPeriodSchema.parse(req.body);
    const period = await service.createAdmissionPeriod(data);
    res.status(201).json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

export async function updateAdmissionPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateAdmissionPeriodSchema.parse(req.body);
    const period = await service.updateAdmissionPeriod(req.params.id, data);
    res.json({ success: true, data: period });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdmissionPeriod(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteAdmissionPeriod(req.params.id);
    res.json({ success: true, message: "Admission period deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getAdmissionPeriodStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await service.getAdmissionPeriodStats(req.params.id);
    if (!stats) {
      throw Errors.notFound("Admission period not found");
    }
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// =====================================
// REGISTRANT CONTROLLERS
// =====================================

export async function getRegistrants(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getRegistrants(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getRegistrantById(req: Request, res: Response, next: NextFunction) {
  try {
    const registrant = await service.getRegistrantById(req.params.id);
    if (!registrant) {
      throw Errors.notFound("Registrant not found");
    }
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function createRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRegistrantSchema.parse(req.body);
    const registrant = await service.createRegistrant(data);
    res.status(201).json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRegistrantSchema.parse(req.body);
    const registrant = await service.updateRegistrant(req.params.id, data);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrantScore(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRegistrantScoreSchema.parse(req.body);
    const registrant = await service.updateRegistrantScore(req.params.id, data);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function updateRegistrantStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateRegistrantStatusSchema.parse(req.body);
    const registrant = await service.updateRegistrantStatus(req.params.id, data);
    res.json({ success: true, data: registrant });
  } catch (error) {
    next(error);
  }
}

export async function enrollRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      nis: z.string().min(1),
      nisn: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const result = await service.enrollRegistrant(req.params.id, {
      nis: data.nis,
      nisn: data.nisn
    });
    res.json({ 
      success: true, 
      data: result,
      message: "Registrant enrolled successfully" 
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRegistrant(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteRegistrant(req.params.id);
    res.json({ success: true, message: "Registrant deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// =====================================
// DOCUMENT CONTROLLERS
// =====================================

export async function getRegistrantDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const documents = await service.getRegistrantDocuments(req.params.registrantId);
    res.json({ success: true, data: documents });
  } catch (error) {
    next(error);
  }
}

export async function createRegistrantDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRegistrantDocumentSchema.parse({
      ...req.body,
      registrantId: req.params.registrantId,
    });
    const document = await service.createRegistrantDocument(data);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function verifyDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = verifyDocumentSchema.parse(req.body);
    const document = await service.verifyDocument(req.params.id, data.isVerified, data.notes);
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function deleteRegistrantDocument(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteRegistrantDocument(req.params.id);
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
}
