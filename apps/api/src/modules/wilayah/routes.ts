import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// ==================== PROVINCES ====================

/**
 * @route GET /api/wilayah/provinces
 * @desc Get all provinces
 */
router.get('/provinces', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provinces = await (prisma as any).province.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: provinces,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/wilayah/provinces/:id
 * @desc Get province by ID
 */
router.get('/provinces/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const province = await (prisma as any).province.findUnique({
      where: { id },
      include: {
        regencies: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!province) {
      return res.status(404).json({
        success: false,
        message: 'Province not found',
      });
    }

    res.json({
      success: true,
      data: province,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== REGENCIES ====================

/**
 * @route GET /api/wilayah/regencies
 * @desc Get regencies (optionally filtered by province)
 */
router.get('/regencies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provinceId, search } = req.query;

    const whereClause: any = {};
    if (provinceId) whereClause.provinceId = provinceId;
    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }

    const regencies = await (prisma as any).regency.findMany({
      where: whereClause,
      include: {
        province: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: regencies,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/wilayah/regencies/:id
 * @desc Get regency by ID
 */
router.get('/regencies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const regency = await (prisma as any).regency.findUnique({
      where: { id },
      include: {
        province: { select: { id: true, name: true } },
        districts: { select: { id: true, name: true, code: true } },
      },
    });

    if (!regency) {
      return res.status(404).json({
        success: false,
        message: 'Regency not found',
      });
    }

    res.json({
      success: true,
      data: regency,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== DISTRICTS ====================

/**
 * @route GET /api/wilayah/districts
 * @desc Get districts (optionally filtered by regency)
 */
router.get('/districts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regencyId, search } = req.query;

    const whereClause: any = {};
    if (regencyId) whereClause.regencyId = regencyId;
    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }

    const districts = await (prisma as any).district.findMany({
      where: whereClause,
      include: {
        regency: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: districts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/wilayah/districts/:id
 * @desc Get district by ID
 */
router.get('/districts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const district = await (prisma as any).district.findUnique({
      where: { id },
      include: {
        regency: { select: { id: true, name: true } },
        villages: { select: { id: true, name: true, code: true } },
      },
    });

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found',
      });
    }

    res.json({
      success: true,
      data: district,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== VILLAGES ====================

/**
 * @route GET /api/wilayah/villages
 * @desc Get villages (optionally filtered by district)
 */
router.get('/villages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { districtId, search, page = 1, limit = 50 } = req.query;

    const whereClause: any = {};
    if (districtId) whereClause.districtId = districtId;
    if (search) {
      whereClause.name = { contains: search as string, mode: 'insensitive' };
    }

    const [villages, total] = await Promise.all([
      (prisma as any).village.findMany({
        where: whereClause,
        include: {
          district: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      (prisma as any).village.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: villages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/wilayah/villages/:id
 * @desc Get village by ID
 */
router.get('/villages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const village = await (prisma as any).village.findUnique({
      where: { id },
      include: {
        district: {
          include: {
            regency: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });

    if (!village) {
      return res.status(404).json({
        success: false,
        message: 'Village not found',
      });
    }

    res.json({
      success: true,
      data: village,
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN ROUTES ====================

router.use(authenticate);

/**
 * @route POST /api/wilayah/provinces
 * @desc Create province (admin only)
 */
router.post(
  '/provinces',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, name } = req.body;

      const province = await (prisma as any).province.create({
        data: { code, name },
      });

      res.status(201).json({
        success: true,
        message: 'Province created',
        data: province,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/wilayah/regencies
 * @desc Create regency (admin only)
 */
router.post(
  '/regencies',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, name, provinceId } = req.body;

      const regency = await (prisma as any).regency.create({
        data: { code, name, provinceId },
      });

      res.status(201).json({
        success: true,
        message: 'Regency created',
        data: regency,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/wilayah/districts
 * @desc Create district (admin only)
 */
router.post(
  '/districts',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, name, regencyId } = req.body;

      const district = await (prisma as any).district.create({
        data: { code, name, regencyId },
      });

      res.status(201).json({
        success: true,
        message: 'District created',
        data: district,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/wilayah/villages
 * @desc Create village (admin only)
 */
router.post(
  '/villages',
  authorize(UserRole.SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, name, districtId, postalCode } = req.body;

      const village = await (prisma as any).village.create({
        data: { code, name, districtId, postalCode },
      });

      res.status(201).json({
        success: true,
        message: 'Village created',
        data: village,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
