import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure file filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    // Audio formats for E-Simaan recitation uploads (MediaRecorder produces
    // audio/webm on Chromium/Firefox and audio/mp4 on WebKit).
    'audio/webm',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: JPG, PNG, WebP, PDF, MP4'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware to map uploaded file to body.fileUrl
export const handleSingleUpload = (fieldName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message,
          },
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message,
          },
        });
      }

      // If file uploaded, map path to fileUrl in body
      if (req.file) {
        // Construct public URL
        const protocol = req.protocol;
        const host = req.get('host');
        const filename = req.file.filename;
        req.body.fileUrl = `${protocol}://${host}/uploads/${filename}`;

        // Also map other metadata if needed
        if (!req.body.fileName) {
          req.body.fileName = req.file.originalname;
        }
        if (!req.body.fileType) {
          if (req.file.mimetype.startsWith('image/')) req.body.fileType = 'image';
          else if (req.file.mimetype.startsWith('video/')) req.body.fileType = 'video';
          else req.body.fileType = 'document';
        }
      }

      next();
    });
  };
};
