import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createCourseSchema, updateCourseSchema, enrollCourseSchema } from './schema';
import { courseService } from './service';
import httpStatus from 'http-status';

const router = Router();

router.get('/', async (req, res) => {
  const courses = await courseService.findAll(req.query.unitId as string);
  res.send(courses);
});

router.get('/:id', async (req, res) => {
  const course = await courseService.findById(req.params.id);
  if (!course) return res.status(httpStatus.NOT_FOUND).send({ message: 'Course not found' });
  res.send(course);
});

router.post('/', validate(createCourseSchema), async (req, res) => {
  const course = await courseService.create(req.body);
  res.status(httpStatus.CREATED).send(course);
});

router.patch('/:id', validate(updateCourseSchema), async (req, res) => {
  const course = await courseService.update(req.params.id, req.body);
  res.send(course);
});

router.post('/enroll', validate(enrollCourseSchema), async (req, res) => {
  try {
    const enrollment = await courseService.enroll(req.body);
    res.status(httpStatus.CREATED).send(enrollment);
  } catch (error: any) {
    res.status(httpStatus.BAD_REQUEST).send({ message: error.message });
  }
});

export default router;
