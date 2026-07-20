import { Router } from 'express';
import { socialService } from './social-service.service';
import socialRoutes from './social-service.routes';

const router = Router();

router.use('/orders', socialRoutes);

export { socialService };
export default router;
