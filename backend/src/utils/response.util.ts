import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = 'Success',
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  error: string = 'Internal Server Error',
  statusCode: number = 500
) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};
