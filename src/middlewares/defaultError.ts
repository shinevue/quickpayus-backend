import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/errorHandler';

interface Error {
  statusCode?: number;
  message?: string;
  name?: string;
  code?: number;
  path?: string;
  keyValue?: Record<string, unknown>;
}

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // wrong mongodb Id error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 401);
  }

  // mongoose duplicate key error
  if (err.code === 11000) {
    const message = `${Object.keys(
      err.keyValue!,
    )} already exist. Please choose another username.`;
    err = new ErrorHandler(message, 401);
  }

  // Wrong JWT Token error
  if (err.name === 'JSONWebTokenError') {
    const message = 'Json Web Token is Invalid, Try again';
  }
};
