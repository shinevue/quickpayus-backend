import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// interface CustomRequest extends Request {
//   user: {
//     id: string;
//   };
//   logEntry?: {
//     timestamp: string;
//     user_id: string;
//     ip_address: string;
//     request_type: string;
//     status: string;
//   };
// }

const logMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    user_id: req.user.id,
    ip_address: req.ip,
    request_type: req.body.request_type || 'login',
    status: 'initiated',
  };

  logger.info(logEntry);
  req.logEntry = logEntry;
  next();
};

export default logMiddleware;
