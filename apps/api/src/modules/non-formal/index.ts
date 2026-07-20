import { Router } from 'express';
import { courseService } from './non-formal.service';
import courseRoutes from './non-formal.routes';

const router = Router();

router.use('/courses', courseRoutes);

export { courseService };
export default router;
