import { Request, Response, NextFunction } from "express";
import * as service from "./service";
import {
  createFoundationSchema,
  updateFoundationSchema,
  createBoardMemberSchema,
  updateBoardMemberSchema,
  createDocumentSchema,
  updateDocumentSchema,
} from "./schema";
import { Errors } from "../../middleware/error";
import { FoundationDashboardStats } from "@cipansor/shared";

// =====================================
// FOUNDATION CONTROLLERS
// =====================================

export async function getFoundations(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getFoundations(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getFoundationById(req: Request, res: Response, next: NextFunction) {
  try {
    const foundation = await service.getFoundationById(req.params.id);
    if (!foundation) {
      throw Errors.notFound("Foundation not found");
    }
    res.json({ success: true, data: foundation });
  } catch (error) {
    next(error);
  }
}

export async function createFoundation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createFoundationSchema.parse(req.body);
    const foundation = await service.createFoundation(data);
    res.status(201).json({ success: true, data: foundation });
  } catch (error) {
    next(error);
  }
}

export async function updateFoundation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateFoundationSchema.parse(req.body);
    const foundation = await service.updateFoundation(req.params.id, data);
    res.json({ success: true, data: foundation });
  } catch (error) {
    next(error);
  }
}

export async function deleteFoundation(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteFoundation(req.params.id);
    res.json({ success: true, message: "Foundation deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getFoundationStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats: FoundationDashboardStats | null = await service.getFoundationStats(req.params.id);
    if (!stats) {
      throw Errors.notFound("Foundation not found");
    }
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// =====================================
// BOARD MEMBER CONTROLLERS
// =====================================

export async function getBoardMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getBoardMembers(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getBoardMemberById(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await service.getBoardMemberById(req.params.id);
    if (!member) {
      throw Errors.notFound("Board member not found");
    }
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function createBoardMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBoardMemberSchema.parse(req.body);
    const member = await service.createBoardMember(data);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function updateBoardMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateBoardMemberSchema.parse(req.body);
    const member = await service.updateBoardMember(req.params.id, data);
    res.json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
}

export async function endBoardMemberTerm(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await service.endBoardMemberTerm(req.params.id);
    res.json({ success: true, data: member, message: "Board member term ended" });
  } catch (error) {
    next(error);
  }
}

export async function deleteBoardMember(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteBoardMember(req.params.id);
    res.json({ success: true, message: "Board member deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// =====================================
// DOCUMENT CONTROLLERS
// =====================================

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = res.locals.validatedQuery;
    const result = await service.getDocuments(query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await service.getDocumentById(req.params.id);
    if (!doc) {
      throw Errors.notFound("Document not found");
    }
    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
}

export async function createDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createDocumentSchema.parse(req.body);
    const doc = await service.createDocument(data);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateDocumentSchema.parse(req.body);
    const doc = await service.updateDocument(req.params.id, data);
    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteDocument(req.params.id);
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    next(error);
  }
}
