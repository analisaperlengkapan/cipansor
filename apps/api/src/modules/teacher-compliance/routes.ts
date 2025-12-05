import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/teacher-compliance/:teacherId
 * @desc Get teacher compliance data (Indonesia fields)
 */
router.get('/:teacherId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teacherId } = req.params;
    
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true } },
        province: { select: { id: true, name: true, code: true } },
        regency: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        village: { select: { id: true, name: true, code: true } }
      }
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/teacher-compliance/:teacherId
 * @desc Update teacher compliance data
 */
router.put('/:teacherId', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { teacherId } = req.params;
    const {
      nik,
      noKK,
      gender,
      birthPlace,
      birthDate,
      religion,
      nationality,
      address,
      // Domisili
      rt,
      rw,
      postalCode,
      provinceId,
      regencyId,
      districtId,
      villageId,
      // Kepegawaian
      employmentStatus,
      pangkat,
      golongan,
      tmtPNS,
      tmtGuru,
      skNumber,
      skDate,
      // Pendidikan
      lastEducation,
      lastEducationYear,
      lastEducationMajor,
      lastEducationInstitution,
      // Sertifikasi
      certificationStatus,
      certificationNumber,
      certificationYear,
      certificationSubject,
      // Bank
      bankName,
      bankAccountNumber,
      bankAccountName,
      // Beban Mengajar
      weeklyHours
    } = req.body;

    // Check teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId }
    });

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Validate NIK uniqueness if provided
    if (nik && nik !== existingTeacher.nik) {
      const nikExists = await prisma.teacher.findFirst({
        where: { nik, id: { not: teacherId } }
      });
      if (nikExists) {
        return res.status(400).json({
          success: false,
          message: 'NIK already exists'
        });
      }
    }

    // Update teacher
    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        nik,
        noKK,
        gender,
        birthPlace,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        religion,
        nationality,
        address,
        rt,
        rw,
        postalCode,
        provinceId,
        regencyId,
        districtId,
        villageId,
        employmentStatus,
        pangkat,
        golongan,
        tmtPNS: tmtPNS ? new Date(tmtPNS) : undefined,
        tmtGuru: tmtGuru ? new Date(tmtGuru) : undefined,
        skNumber,
        skDate: skDate ? new Date(skDate) : undefined,
        lastEducation,
        lastEducationYear,
        lastEducationMajor,
        lastEducationInstitution,
        certificationStatus,
        certificationNumber,
        certificationYear,
        certificationSubject,
        bankName,
        bankAccountNumber,
        bankAccountName,
        weeklyHours
      }
    });

    res.json({
      success: true,
      message: 'Teacher compliance data updated',
      data: updatedTeacher
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/teacher-compliance/report/completeness
 * @desc Get compliance completeness report for all teachers
 */
router.get('/report/completeness', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, status } = req.query;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true } }
      }
    });

    // Calculate completeness for each teacher
    const requiredFields = [
      'nik', 'nuptk', 'birthPlace', 'birthDate',
      'employmentStatus', 'lastEducation', 'address',
      'provinceId', 'regencyId', 'districtId', 'villageId'
    ];

    const report = teachers.map(teacher => {
      const filledFields = requiredFields.filter(field => (teacher as any)[field]);
      const completeness = Math.round((filledFields.length / requiredFields.length) * 100);
      
      const missingFields = requiredFields.filter(field => !(teacher as any)[field]);
      
      // Check certification completeness
      const hasCertification = teacher.certificationStatus !== null;
      
      return {
        id: teacher.id,
        name: teacher.user.name,
        nip: teacher.nip,
        nuptk: teacher.nuptk,
        unit: teacher.unit?.name,
        completeness,
        missingFields,
        hasCertification,
        certificationStatus: teacher.certificationStatus,
        status: completeness === 100 ? 'complete' : completeness >= 70 ? 'partial' : 'incomplete'
      };
    });

    // Filter by status if provided
    const filteredReport = status 
      ? report.filter(r => r.status === status)
      : report;

    // Summary
    const summary = {
      total: report.length,
      complete: report.filter(r => r.status === 'complete').length,
      partial: report.filter(r => r.status === 'partial').length,
      incomplete: report.filter(r => r.status === 'incomplete').length,
      averageCompleteness: Math.round(report.reduce((acc, r) => acc + r.completeness, 0) / report.length) || 0,
      certified: teachers.filter(t => t.certificationStatus === 'SUDAH_SERTIFIKASI').length,
      notCertified: teachers.filter(t => t.certificationStatus !== 'SUDAH_SERTIFIKASI').length
    };

    res.json({
      success: true,
      data: {
        summary,
        teachers: filteredReport
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/teacher-compliance/report/simtun-ready
 * @desc Get teachers ready for SIMTUN/EMIS export
 */
router.get('/report/simtun-ready', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId } = req.query;

    const whereClause: any = {
      nik: { not: null },
      nuptk: { not: null },
      birthPlace: { not: null },
      birthDate: { not: null },
      employmentStatus: { not: null }
    };
    if (unitId) whereClause.unitId = unitId;

    const readyTeachers = await prisma.teacher.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true, npsn: true } },
        teacherSubjects: {
          include: { subject: { select: { name: true, code: true } } }
        }
      }
    });

    const notReadyCount = await prisma.teacher.count({
      where: {
        OR: [
          { nik: null },
          { nuptk: null },
          { birthPlace: null },
          { birthDate: null },
          { employmentStatus: null }
        ],
        ...(unitId ? { unitId: unitId as string } : {})
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          ready: readyTeachers.length,
          notReady: notReadyCount,
          total: readyTeachers.length + notReadyCount
        },
        teachers: readyTeachers.map(t => ({
          id: t.id,
          nip: t.nip,
          nuptk: t.nuptk,
          nik: t.nik,
          name: t.user.name,
          birthPlace: t.birthPlace,
          birthDate: t.birthDate,
          gender: t.gender,
          religion: t.religion,
          employmentStatus: t.employmentStatus,
          pangkat: t.pangkat,
          golongan: t.golongan,
          lastEducation: t.lastEducation,
          lastEducationMajor: t.lastEducationMajor,
          certificationStatus: t.certificationStatus,
          certificationNumber: t.certificationNumber,
          certificationSubject: t.certificationSubject,
          weeklyHours: t.weeklyHours,
          address: t.address,
          unit: t.unit?.name,
          npsn: t.unit?.npsn,
          subjects: t.teacherSubjects.map(ts => ts.subject.name)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/teacher-compliance/report/certification
 * @desc Get teacher certification status report
 */
router.get('/report/certification', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId } = req.query;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;

    const teachers = await prisma.teacher.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true } },
        teacherSubjects: {
          include: { subject: { select: { name: true } } }
        }
      },
      orderBy: [
        { certificationStatus: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    const certified = teachers.filter(t => t.certificationStatus === 'SUDAH_SERTIFIKASI');
    const notCertified = teachers.filter(t => t.certificationStatus !== 'SUDAH_SERTIFIKASI');

    // Group by certification subject
    const bySubject = certified.reduce((acc: any, t) => {
      const subject = t.certificationSubject || 'Unknown';
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push({
        id: t.id,
        name: t.user.name,
        nuptk: t.nuptk,
        certificationNumber: t.certificationNumber,
        certificationYear: t.certificationYear
      });
      return acc;
    }, {});

    // Group by certification year
    const byYear = certified.reduce((acc: any, t) => {
      const year = t.certificationYear?.toString() || 'Unknown';
      if (!acc[year]) acc[year] = 0;
      acc[year]++;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          total: teachers.length,
          certified: certified.length,
          notCertified: notCertified.length,
          certificationRate: Math.round((certified.length / teachers.length) * 100) || 0
        },
        bySubject,
        byYear,
        certified: certified.map(t => ({
          id: t.id,
          name: t.user.name,
          nip: t.nip,
          nuptk: t.nuptk,
          certificationNumber: t.certificationNumber,
          certificationSubject: t.certificationSubject,
          certificationYear: t.certificationYear,
          unit: t.unit?.name
        })),
        notCertified: notCertified.map(t => ({
          id: t.id,
          name: t.user.name,
          nip: t.nip,
          nuptk: t.nuptk,
          lastEducation: t.lastEducation,
          lastEducationMajor: t.lastEducationMajor,
          specialization: t.specialization,
          unit: t.unit?.name
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/teacher-compliance/bulk-update
 * @desc Bulk update teacher compliance data
 */
router.post('/bulk-update', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { teacherId, ...data } = update;
        
        if (!teacherId) {
          errors.push({ teacherId: null, error: 'Teacher ID is required' });
          continue;
        }

        // Convert date strings to Date objects
        const processedData: any = { ...data };
        const dateFields = ['birthDate', 'tmtPNS', 'tmtGuru', 'skDate'];
        for (const field of dateFields) {
          if (data[field]) processedData[field] = new Date(data[field]);
        }

        const updated = await prisma.teacher.update({
          where: { id: teacherId },
          data: processedData,
          include: { user: { select: { name: true } } }
        });

        results.push({ teacherId, success: true, name: updated.user.name });
      } catch (error: any) {
        errors.push({ 
          teacherId: update.teacherId, 
          error: error.message || 'Update failed' 
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} teachers, ${errors.length} errors`,
      data: {
        successful: results,
        failed: errors
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
