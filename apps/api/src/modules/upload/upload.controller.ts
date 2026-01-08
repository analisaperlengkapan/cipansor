import { Request, Response } from 'express';
import { ApiResponse } from '@cipansor/shared';

export const uploadController = {
  uploadFile: async (req: Request, res: Response<ApiResponse<{ url: string; filename: string; mimetype: string; size: number }>>) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded',
          },
        });
      }

      // The handleSingleUpload middleware already attaches fileUrl to body if successful
      // But we can also construct the response from req.file directly for more details

      const protocol = req.protocol;
      const host = req.get('host');
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      return res.status(200).json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown upload error',
        },
      });
    }
  },
};
