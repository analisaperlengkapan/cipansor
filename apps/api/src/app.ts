import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error';
import { swaggerSpec } from '@/config/swagger';

// Import routes
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/user.routes';
import unitRoutes from '@/modules/units/unit.routes';
import studentRoutes from '@/modules/students/student.routes';
import classRoutes from '@/modules/classes/class.routes';
import academicYearRoutes from '@/modules/academic-years/academic-year.routes';
import attendanceRoutes from '@/modules/attendance/attendance.routes';
import tahfidzRoutes from '@/modules/tahfidz/tahfidz.routes';
import dormitoryRoutes from '@/modules/dormitories/routes';
import permitRoutes from '@/modules/permits/routes';
import violationRoutes from '@/modules/violations/routes';
import rewardRoutes from '@/modules/rewards/routes';
import financeRoutes from '@/modules/finance/routes';
import foundationRoutes from '@/modules/foundation/routes';
import psbRoutes from '@/modules/psb/routes';
import hrRoutes from '@/modules/hr/routes';
import libraryRoutes from '@/modules/library/routes';
import healthRoutes from '@/modules/health/routes';
import inventoryRoutes from '@/modules/inventory/routes';
import notificationRoutes from '@/modules/notifications/routes';
import curriculumRoutes from '@/modules/curriculum/routes';
import assessmentRoutes from '@/modules/assessment/routes';
import alumniRoutes from '@/modules/alumni/routes';
import analyticsRoutes from '@/modules/analytics/routes';
import parentRoutes from '@/modules/parent/routes';
import reportingRoutes from '@/modules/reporting/routes';
import rolesRoutes from '@/modules/roles/roles.routes';
import { takhosusRoutes } from '@/modules/takhosus';
import { muhasabahRoutes } from '@/modules/muhasabah';
import { donationRoutes } from '@/modules/donation';
import { ppdbWaveRoutes } from '@/modules/ppdb-wave';
import { wilayahRoutes } from '@/modules/wilayah';
import { kurikulumMerdekaRoutes } from '@/modules/kurikulum-merdeka';
import { facilitiesRoutes } from '@/modules/facilities';
import { studentComplianceRoutes } from '@/modules/student-compliance';
import { teacherComplianceRoutes } from '@/modules/teacher-compliance';
import { financeEnhancementRoutes } from '@/modules/finance-enhancement';

// Phase 12 routes
import extracurricularRoutes from '@/modules/extracurricular/extracurricular.routes';
import counselingRoutes from '@/modules/counseling/counseling.routes';
import dutyRosterRoutes from '@/modules/duty-roster/duty-roster.routes';
import mealsRoutes from '@/modules/meals/meals.routes';
import calendarRoutes from '@/modules/calendar/calendar.routes';
import homeroomRoutes from '@/modules/homeroom/homeroom.routes';
import kitabProgressRoutes from '@/modules/kitab-progress/kitab-progress.routes';
import muhadhorohRoutes from '@/modules/muhadhoroh/muhadhoroh.routes';
import muhadatsahRoutes from '@/modules/muhadatsah/muhadatsah.routes';
import emisRoutes from '@/modules/emis/emis.routes';

// Create Express app
const app = express();

// Trust proxy (for production behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Swagger API Documentation
console.log('App: swaggerSpec paths:', Object.keys(swaggerSpec.paths || {}));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Cipansor API Documentation',
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/units', unitRoutes);
apiRouter.use('/students', studentRoutes);
apiRouter.use('/classes', classRoutes);
apiRouter.use('/academic-years', academicYearRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/tahfidz', tahfidzRoutes);
apiRouter.use('/dormitories', dormitoryRoutes);
apiRouter.use('/permits', permitRoutes);
apiRouter.use('/violations', violationRoutes);
apiRouter.use('/rewards', rewardRoutes);
apiRouter.use('/finance', financeRoutes);
apiRouter.use('/foundation', foundationRoutes);
apiRouter.use('/psb', psbRoutes);
apiRouter.use('/hr', hrRoutes);
apiRouter.use('/library', libraryRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/curriculum', curriculumRoutes);
apiRouter.use('/assessment', assessmentRoutes);
apiRouter.use('/alumni', alumniRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/parent', parentRoutes);
apiRouter.use('/reports', reportingRoutes);
apiRouter.use('/roles', rolesRoutes);
apiRouter.use('/takhosus', takhosusRoutes);
apiRouter.use('/muhasabah', muhasabahRoutes);
apiRouter.use('/donation', donationRoutes);
apiRouter.use('/ppdb-wave', ppdbWaveRoutes);
apiRouter.use('/wilayah', wilayahRoutes);
apiRouter.use('/kurikulum-merdeka', kurikulumMerdekaRoutes);
apiRouter.use('/facilities', facilitiesRoutes);
apiRouter.use('/student-compliance', studentComplianceRoutes);
apiRouter.use('/teacher-compliance', teacherComplianceRoutes);
apiRouter.use('/finance-enhancement', financeEnhancementRoutes);

// Phase 12 routes
apiRouter.use('/extracurricular', extracurricularRoutes);
apiRouter.use('/counseling', counselingRoutes);
apiRouter.use('/duty-roster', dutyRosterRoutes);
apiRouter.use('/meals', mealsRoutes);
apiRouter.use('/calendar', calendarRoutes);
apiRouter.use('/homeroom', homeroomRoutes);
apiRouter.use('/kitab-progress', kitabProgressRoutes);
apiRouter.use('/muhadhoroh', muhadhorohRoutes);
apiRouter.use('/muhadatsah', muhadatsahRoutes);
apiRouter.use('/emis', emisRoutes);

// API info
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Cipansor API',
    version: '1.0.0',
    description: 'Yayasan Pesantren Cipansor - Islamic Education Institution Management System',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      units: '/api/units',
      students: '/api/students',
      classes: '/api/classes',
      academicYears: '/api/academic-years',
      attendance: '/api/attendance',
      tahfidz: '/api/tahfidz',
      takhosus: '/api/takhosus',
      muhasabah: '/api/muhasabah',
      dormitories: '/api/dormitories',
      permits: '/api/permits',
      violations: '/api/violations',
      rewards: '/api/rewards',
      finance: '/api/finance',
      donation: '/api/donation',
      foundation: '/api/foundation',
      psb: '/api/psb',
      ppdbWave: '/api/ppdb-wave',
      hr: '/api/hr',
      library: '/api/library',
      health: '/api/health',
      inventory: '/api/inventory',
      notifications: '/api/notifications',
      curriculum: '/api/curriculum',
      assessment: '/api/assessment',
      alumni: '/api/alumni',
      analytics: '/api/analytics',
      parent: '/api/parent',
      reports: '/api/reports',
      // Phase 12 endpoints
      extracurricular: '/api/extracurricular',
      counseling: '/api/counseling',
      dutyRoster: '/api/duty-roster',
      meals: '/api/meals',
      calendar: '/api/calendar',
      homeroom: '/api/homeroom',
      kitabProgress: '/api/kitab-progress',
      muhadhoroh: '/api/muhadhoroh',
      muhadatsah: '/api/muhadatsah',
      emis: '/api/emis',
      wilayah: '/api/wilayah',
      kurikulumMerdeka: '/api/kurikulum-merdeka',
      facilities: '/api/facilities',
      studentCompliance: '/api/student-compliance',
      teacherCompliance: '/api/teacher-compliance',
      financeEnhancement: '/api/finance-enhancement',
    },
  });
});

// Mount API router
app.use('/api', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
