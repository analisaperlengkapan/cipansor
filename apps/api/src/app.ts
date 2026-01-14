import express from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from '@/config';
import { logger } from '@/lib/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error';
import { defaultLimiter, authLimiter } from '@/middleware/rate-limit';
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
import messageRoutes from '@/modules/messages/messages.routes';
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
import { walletRoutes } from '@/modules/wallet';
import { canteenRoutes } from '@/modules/canteen';
import { laundryRoutes } from '@/modules/laundry';
import { payrollRoutes } from '@/modules/payroll';
import pkgRoutes from '@/modules/pkg/routes';
import portfolioRoutes from '@/modules/portfolio/routes';
import ibadahRoutes from '@/modules/ibadah/routes';
import raporPesantrenRoutes from '@/modules/rapor-pesantren/routes';
import { procurementRoutes } from '@/modules/procurement/procurement.routes';
import { uploadRoutes } from '@/modules/upload/upload.routes';

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
import { dapodikRouter } from '@/modules/dapodik/dapodik.routes';
import correspondenceRoutes from '@/modules/correspondence/correspondence.routes';
import { qualityRoutes } from '@/modules/quality/quality.routes';

// Enhancement module routes
import { paudAssessmentRoutes } from '@/modules/paud-assessment';
import { paudReportRouter } from '@/modules/paud-report';
import { dailyReportRoutes } from '@/modules/daily-report';
import { murojaahRoutes } from '@/modules/murojaah';
import { simaanRoutes } from '@/modules/simaan';
import { dashboardEnhancementRoutes } from '@/modules/dashboard-enhancement';
import { sanadCertificateRouter } from '@/modules/sanad-certificate';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import receptionRoutes from '@/modules/reception/reception.routes';
import marketingRoutes from '@/modules/marketing/routes';

// Create Express app
const app = express();

// Sentry Request Handler
Sentry.setupExpressErrorHandler(app);

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

// Static files
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Rate limiting - apply to all routes except health check
// Active in all environments except test and development
if (config.env !== 'test' && config.env !== 'development') {
  app.use(defaultLimiter);
}

// Logging
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.http(message.trim()),
    },
  }));
}

// Health check endpoint (not rate limited)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.env,
  });
});

// Swagger API Documentation (disabled in production for security)
if (config.env !== 'production') {
  console.info('App: swaggerSpec paths:', Object.keys(swaggerSpec.paths || {}));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Cipansor API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// API routes
const apiRouter = express.Router();

// Apply stricter rate limiting to auth routes
// Apply stricter rate limiting to auth routes
if (config.env !== 'test' && config.env !== 'development') {
  apiRouter.use('/auth', authLimiter, authRoutes);
} else {
  apiRouter.use('/auth', authRoutes);
}
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
apiRouter.use('/marketing', marketingRoutes);
apiRouter.use('/hr', hrRoutes);
apiRouter.use('/library', libraryRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/messages', messageRoutes);
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
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/canteen', canteenRoutes);
apiRouter.use('/laundry', laundryRoutes);
apiRouter.use('/payroll', payrollRoutes);
apiRouter.use('/pkg', pkgRoutes);
apiRouter.use('/portfolio', portfolioRoutes);
apiRouter.use('/ibadah', ibadahRoutes);
apiRouter.use('/rapor-pesantren', raporPesantrenRoutes);
apiRouter.use('/procurement', procurementRoutes);
apiRouter.use('/upload', uploadRoutes);

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
apiRouter.use('/dapodik', dapodikRouter);
apiRouter.use('/correspondence', correspondenceRoutes);
apiRouter.use('/quality', qualityRoutes);

// Enhancement modules
apiRouter.use('/paud-assessment', paudAssessmentRoutes);
apiRouter.use('/paud-report', paudReportRouter);
apiRouter.use('/daily-report', dailyReportRoutes);
apiRouter.use('/murojaah', murojaahRoutes);
apiRouter.use('/simaan', simaanRoutes);
apiRouter.use('/dashboard-enhancement', dashboardEnhancementRoutes);
apiRouter.use('/sanad', sanadCertificateRouter);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/reception', receptionRoutes);

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
      marketing: '/api/marketing',
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
      dapodik: '/api/dapodik',
      wilayah: '/api/wilayah',
      kurikulumMerdeka: '/api/kurikulum-merdeka',
      facilities: '/api/facilities',
      studentCompliance: '/api/student-compliance',
      teacherCompliance: '/api/teacher-compliance',
      financeEnhancement: '/api/finance-enhancement',
      wallet: '/api/wallet',
      canteen: '/api/canteen',
      laundry: '/api/laundry',
      pkg: '/api/pkg',
      portfolio: '/api/portfolio',
      ibadah: '/api/ibadah',
      raporPesantren: '/api/rapor-pesantren',
      reception: '/api/reception',
    },
  });
});

// Mount API router
app.use('/api', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
