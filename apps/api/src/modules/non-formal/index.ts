import { Router } from 'express';
import { courseService } from './service';
import courseRoutes from './routes';

const router = Router();

router.use('/courses', courseRoutes);

export { courseService };
export default router;
