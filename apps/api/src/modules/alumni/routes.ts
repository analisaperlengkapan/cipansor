import { Router } from 'express';
import * as controller from './controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== ALUMNI ====================

/**
 * @swagger
 * /api/alumni/stats/tracer:
 *   get:
 *     summary: Get alumni tracer study statistics
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alumni tracer study statistics
 */
router.get('/stats/tracer', controller.getTracerStudyStats);
/**
 * @swagger
 * /api/alumni/stats/outcome:
 *   get:
 *     summary: Get alumni outcome analytics (career/education correlation)
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alumni outcome analytics data
 *       403:
 *         description: Access denied to cross-unit data
 */
router.get('/stats/outcome', controller.getOutcomeAnalytics);

/**
 * @swagger
 * /api/alumni:
 *   get:
 *     summary: List alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: graduationYear
 *         schema:
 *           type: integer
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of alumni
 */
router.get('/', controller.getAlumni);

/**
 * @swagger
 * /api/alumni/stats:
 *   get:
 *     summary: Get alumni statistics
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alumni statistics (total, by year, by career, etc.)
 */
router.get('/stats', controller.getAlumniStats);

/**
 * @swagger
 * /api/alumni/{id}:
 *   get:
 *     summary: Get alumni by ID
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alumni details
 *       404:
 *         description: Alumni not found
 */
router.get('/:id', controller.getAlumniById);

/**
 * @swagger
 * /api/alumni:
 *   post:
 *     summary: Create alumni record
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - graduationYear
 *             properties:
 *               name:
 *                 type: string
 *               graduationYear:
 *                 type: integer
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               unitId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Alumni created
 */
router.post('/', controller.createAlumni);

/**
 * @swagger
 * /api/alumni/{id}:
 *   put:
 *     summary: Update alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Alumni updated
 *       404:
 *         description: Alumni not found
 */
router.put('/:id', controller.updateAlumni);

/**
 * @swagger
 * /api/alumni/{id}:
 *   delete:
 *     summary: Delete alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Alumni deleted
 *       404:
 *         description: Alumni not found
 */
router.delete('/:id', controller.deleteAlumni);

/**
 * @swagger
 * /api/alumni/from-student/{studentId}:
 *   post:
 *     summary: Convert student to alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID to convert
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               graduationYear:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Student converted to alumni
 *       404:
 *         description: Student not found
 */
router.post('/from-student/:studentId', controller.convertFromStudent);

// ==================== CAREERS ====================

/**
 * @swagger
 * /api/alumni/{alumniId}/careers:
 *   get:
 *     summary: Get careers for an alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alumniId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of careers
 */
router.get('/:alumniId/careers', controller.getCareersByAlumni);

/**
 * @swagger
 * /api/alumni/{alumniId}/careers:
 *   post:
 *     summary: Add career to alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alumniId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - position
 *             properties:
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isCurrent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Career added
 */
router.post('/:alumniId/careers', controller.createCareer);

/**
 * @swagger
 * /api/alumni/careers/{id}:
 *   put:
 *     summary: Update career
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Career updated
 */
router.put('/careers/:id', controller.updateCareer);

/**
 * @swagger
 * /api/alumni/careers/{id}:
 *   delete:
 *     summary: Delete career
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Career deleted
 */
router.delete('/careers/:id', controller.deleteCareer);

// ==================== EDUCATION ====================

/**
 * @swagger
 * /api/alumni/{alumniId}/education:
 *   get:
 *     summary: Get education history for an alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alumniId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of education records
 */
router.get('/:alumniId/education', controller.getEducationsByAlumni);

/**
 * @swagger
 * /api/alumni/{alumniId}/education:
 *   post:
 *     summary: Add education record to alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alumniId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - institution
 *               - degree
 *             properties:
 *               institution:
 *                 type: string
 *               degree:
 *                 type: string
 *               field:
 *                 type: string
 *               startYear:
 *                 type: integer
 *               endYear:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Education added
 */
router.post('/:alumniId/education', controller.createEducation);

/**
 * @swagger
 * /api/alumni/education/{id}:
 *   put:
 *     summary: Update education record
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Education updated
 */
router.put('/education/:id', controller.updateEducation);

/**
 * @swagger
 * /api/alumni/education/{id}:
 *   delete:
 *     summary: Delete education record
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Education deleted
 */
router.delete('/education/:id', controller.deleteEducation);

// ==================== DONATIONS ====================

/**
 * @swagger
 * /api/alumni/donations/list:
 *   get:
 *     summary: List all donations
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of donations
 */
router.get('/donations/list', controller.getDonations);

/**
 * @swagger
 * /api/alumni/{alumniId}/donations:
 *   post:
 *     summary: Create donation from alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alumniId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               purpose:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Donation created
 */
router.post('/:alumniId/donations', controller.createDonation);

/**
 * @swagger
 * /api/alumni/donations/{id}:
 *   put:
 *     summary: Update donation
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Donation updated
 */
router.put('/donations/:id', controller.updateDonation);

/**
 * @swagger
 * /api/alumni/donations/{id}:
 *   delete:
 *     summary: Delete donation
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Donation deleted
 */
router.delete('/donations/:id', controller.deleteDonation);

// ==================== EVENTS ====================

/**
 * @swagger
 * /api/alumni/events/list:
 *   get:
 *     summary: List alumni events
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/events/list', controller.getEvents);

/**
 * @swagger
 * /api/alumni/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
router.get('/events/:id', controller.getEventById);

/**
 * @swagger
 * /api/alumni/events:
 *   post:
 *     summary: Create alumni event
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               maxAttendees:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/events', controller.createEvent);

/**
 * @swagger
 * /api/alumni/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/events/:id', controller.updateEvent);

/**
 * @swagger
 * /api/alumni/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Event deleted
 */
router.delete('/events/:id', controller.deleteEvent);

// ==================== EVENT ATTENDEES ====================

/**
 * @swagger
 * /api/alumni/events/{eventId}/register:
 *   post:
 *     summary: Register for an event
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alumniId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registered for event
 */
router.post('/events/:eventId/register', controller.registerForEvent);

/**
 * @swagger
 * /api/alumni/events/attendees/{id}/status:
 *   put:
 *     summary: Update attendee status
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REGISTERED, ATTENDED, CANCELLED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/events/attendees/:id/status', controller.updateAttendeeStatus);

/**
 * @swagger
 * /api/alumni/events/attendees/{id}:
 *   delete:
 *     summary: Cancel event registration
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Registration cancelled
 */
router.delete('/events/attendees/:id', controller.cancelRegistration);

router.get('/sanad/tree', controller.getSanadTree);
export default router;
