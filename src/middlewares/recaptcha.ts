import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../utils/errorHandler';
import verifyCaptcha from '../utils/recaptchaVerifier';
import catchAsyncErrors from './catchAsyncErrors';

interface CaptchaRequest extends Request {
  body: {
    recaptchaToken: string;
  };
}

export const isCaptchaVerified = catchAsyncErrors(
  async (req: CaptchaRequest, res: Response, next: NextFunction) => {
    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return next(new ErrorHandler('Recaptcha token is missing', 400));
    }

    const result = await verifyCaptcha(recaptchaToken);
    if (!result) {
      return next(
        new ErrorHandler(
          'Something went wrong validating re-captcha. Please try again',
          401,
        ),
      );
    }
    next();
  },
);
