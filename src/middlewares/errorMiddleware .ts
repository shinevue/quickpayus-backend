// src/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/errorHandler';

const errorMiddleware = (err: ErrorHandler, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;
