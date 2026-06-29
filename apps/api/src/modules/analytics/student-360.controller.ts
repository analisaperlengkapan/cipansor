import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/error';
import { ApiResponse } from '@/utils/response';
import { student360Service } from './student-360.service';

export const getStudent360 = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await student360Service.getStudent360(id);
  res.json(ApiResponse.success(data));
});
