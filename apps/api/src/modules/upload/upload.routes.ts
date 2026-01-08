import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { handleSingleUpload } from '../../middleware/upload';
import { uploadController } from './upload.controller';

const router = Router();

// Protect all upload routes
router.use(authenticate());

router.post(
  '/',
  handleSingleUpload('file'),
  uploadController.uploadFile
);

export const uploadRoutes = router;
