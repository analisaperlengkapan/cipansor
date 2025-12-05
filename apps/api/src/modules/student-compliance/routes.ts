import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '@/lib/prisma';
import { authenticate, authorize } from '@/middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/student-compliance/:studentId
 * @desc Get student compliance data (Indonesia fields)
 */
router.get('/:studentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        unit: { select: { id: true, name: true } },
        province: { select: { id: true, name: true, code: true } },
        regency: { select: { id: true, name: true, code: true } },
        district: { select: { id: true, name: true, code: true } },
        village: { select: { id: true, name: true, code: true } }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /api/student-compliance/:studentId
 * @desc Update student compliance data
 */
router.put('/:studentId', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const {
      nisn,
      nik,
      noAkta,
      noKK,
      religion,
      nationality,
      // Domisili
      rt,
      rw,
      postalCode,
      provinceId,
      regencyId,
      districtId,
      villageId,
      // Transport
      transportMode,
      distanceToSchool,
      travelTime,
      // Kesejahteraan
      kipNumber,
      isPkh,
      isKks,
      // Kesehatan
      bloodType,
      height,
      weight,
      headCircumference,
      specialNeeds,
      // Keluarga
      numberOfSiblings,
      childOrder,
      livingWith,
      // Ayah
      fatherName,
      fatherNik,
      fatherBirthPlace,
      fatherBirthDate,
      fatherEducation,
      fatherOccupation,
      fatherIncome,
      fatherPhone,
      // Ibu
      motherName,
      motherNik,
      motherBirthPlace,
      motherBirthDate,
      motherEducation,
      motherOccupation,
      motherIncome,
      motherPhone,
      // Wali
      guardianName,
      guardianNik,
      guardianRelation,
      guardianEducation,
      guardianOccupation,
      guardianIncome,
      guardianPhone
    } = req.body;

    // Check student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate NISN uniqueness if provided
    if (nisn && nisn !== existingStudent.nisn) {
      const nisnExists = await prisma.student.findFirst({
        where: { nisn, id: { not: studentId } }
      });
      if (nisnExists) {
        return res.status(400).json({
          success: false,
          message: 'NISN already exists'
        });
      }
    }

    // Validate NIK uniqueness if provided
    if (nik && nik !== existingStudent.nik) {
      const nikExists = await prisma.student.findFirst({
        where: { nik, id: { not: studentId } }
      });
      if (nikExists) {
        return res.status(400).json({
          success: false,
          message: 'NIK already exists'
        });
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        nisn,
        nik,
        noAkta,
        noKK,
        religion,
        nationality,
        rt,
        rw,
        postalCode,
        provinceId,
        regencyId,
        districtId,
        villageId,
        transportMode,
        distanceToSchool,
        travelTime,
        kipNumber,
        isPkh,
        isKks,
        bloodType,
        height,
        weight,
        headCircumference,
        specialNeeds,
        numberOfSiblings,
        childOrder,
        livingWith,
        fatherName,
        fatherNik,
        fatherBirthPlace,
        fatherBirthDate: fatherBirthDate ? new Date(fatherBirthDate) : undefined,
        fatherEducation,
        fatherOccupation,
        fatherIncome,
        fatherPhone,
        motherName,
        motherNik,
        motherBirthPlace,
        motherBirthDate: motherBirthDate ? new Date(motherBirthDate) : undefined,
        motherEducation,
        motherOccupation,
        motherIncome,
        motherPhone,
        guardianName,
        guardianNik,
        guardianRelation,
        guardianEducation,
        guardianOccupation,
        guardianIncome,
        guardianPhone
      }
    });

    res.json({
      success: true,
      message: 'Student compliance data updated',
      data: updatedStudent
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/student-compliance/report/completeness
 * @desc Get compliance completeness report for all students
 */
router.get('/report/completeness', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId, status } = req.query;

    const whereClause: any = {};
    if (unitId) whereClause.unitId = unitId;
    if (status) whereClause.status = status;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { select: { name: true } } },
          take: 1
        }
      }
    });

    // Calculate completeness for each student
    const requiredFields = [
      'nisn', 'nik', 'noKK', 'birthPlace', 'birthDate', 'religion', 'address',
      'provinceId', 'regencyId', 'districtId', 'villageId',
      'fatherName', 'motherName'
    ];

    const report = students.map(student => {
      const filledFields = requiredFields.filter(field => (student as any)[field]);
      const completeness = Math.round((filledFields.length / requiredFields.length) * 100);
      
      const missingFields = requiredFields.filter(field => !(student as any)[field]);
      
      return {
        id: student.id,
        name: student.user.name,
        nis: student.nis,
        unit: student.unit?.name,
        class: student.enrollments[0]?.class?.name || '-',
        completeness,
        missingFields,
        status: completeness === 100 ? 'complete' : completeness >= 70 ? 'partial' : 'incomplete'
      };
    });

    // Summary
    const summary = {
      total: report.length,
      complete: report.filter(r => r.status === 'complete').length,
      partial: report.filter(r => r.status === 'partial').length,
      incomplete: report.filter(r => r.status === 'incomplete').length,
      averageCompleteness: Math.round(report.reduce((acc, r) => acc + r.completeness, 0) / report.length) || 0
    };

    res.json({
      success: true,
      data: {
        summary,
        students: report
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/student-compliance/report/dapodik-ready
 * @desc Get students ready for Dapodik export
 */
router.get('/report/dapodik-ready', authorize(UserRole.SUPER_ADMIN, UserRole.UNIT_ADMIN, UserRole.STAFF), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unitId } = req.query;

    const whereClause: any = {
      nisn: { not: null },
      nik: { not: null },
      birthPlace: { not: null },
      birthDate: { not: null }
    };
    if (unitId) whereClause.unitId = unitId;

    const readyStudents = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        unit: { select: { name: true, npsn: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: { select: { name: true } } },
          take: 1
        }
      }
    });

    const notReadyCount = await prisma.student.count({
      where: {
        OR: [
          { nisn: { equals: null } },
          { nik: { equals: null } },
          { birthPlace: '' },
          { birthDate: { equals: null } }
        ] as any,
        ...(unitId ? { unitId: unitId as string } : {})
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          ready: readyStudents.length,
          notReady: notReadyCount,
          total: readyStudents.length + notReadyCount
        },
        students: readyStudents.map(s => ({
          id: s.id,
          nis: s.nis,
          nisn: s.nisn,
          nik: s.nik,
          name: s.user.name,
          birthPlace: s.birthPlace,
          birthDate: s.birthDate,
          gender: s.gender,
          religion: s.religion,
          address: s.address,
          transportMode: s.transportMode,
          distanceToSchool: s.distanceToSchool,
          specialNeeds: s.specialNeeds,
          kipNumber: s.kipNumber,
          unit: s.unit?.name,
          npsn: s.unit?.npsn,
          class: s.enrollments[0]?.class?.name || '-'
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/student-compliance/bulk-update
 * @desc Bulk update student compliance data
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
        const { studentId, ...data } = update;
        
        if (!studentId) {
          errors.push({ studentId: null, error: 'Student ID is required' });
          continue;
        }

        // Convert date strings to Date objects
        const processedData: any = { ...data };
        if (data.fatherBirthDate) processedData.fatherBirthDate = new Date(data.fatherBirthDate);
        if (data.motherBirthDate) processedData.motherBirthDate = new Date(data.motherBirthDate);

        const updated = await prisma.student.update({
          where: { id: studentId },
          data: processedData,
          include: { user: { select: { name: true } } }
        });

        results.push({ studentId, success: true, name: updated.user.name });
      } catch (error: any) {
        errors.push({ 
          studentId: update.studentId, 
          error: error.message || 'Update failed' 
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} students, ${errors.length} errors`,
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
