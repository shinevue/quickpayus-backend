import { Request, Response, NextFunction } from 'express';

type AsyncMiddleware = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (thefunc: AsyncMiddleware) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(thefunc(req, res, next)).catch(next);
  };
};

export default asyncHandler;