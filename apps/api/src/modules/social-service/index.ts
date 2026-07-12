import { Router } from 'express';
import { socialService } from './service';
import socialRoutes from './routes';

const router = Router();

router.use('/orders', socialRoutes);

export { socialService };
export default router;
