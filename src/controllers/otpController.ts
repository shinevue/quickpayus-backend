import { Request, Response, NextFunction } from 'express';
import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import OTP, { IOTP } from '../models/otpModel'; // Adjust the import based on your OTP model
import User, { IUser } from '../models/userModel'; // Adjust the import based on your User model
import ErrorHandler from '../utils/errorHandler';
import logger from '../config/logger';
import {
  sendEmail,
  sendWarningEmail,
  emailTemplates,
} from '../utils/sendEmail';

export const create = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, id } = req.user || {};
    const otpModel: IOTP = new OTP({ userId: id, ip: req.logEntry.ip_address });
    await otpModel.save();
    const otp = otpModel?.code?.toString();

    let success = false;
    try {
      // Uncomment and implement the email sending logic
      // await sendEmail(
      //   {
      //     email: email,
      //     ...emailTemplates.otpEmailConfirm,
      //   },
      //   otp
      // );
      success = true;
    } catch (error) {
      console.error(error);
      success = false;
    }

    let deliveryStatus = success ? 'sms_sent' : 'sms_failed';
    req.logEntry.status = success ? 'success' : 'failure';
    req.logEntry.delivery_status = deliveryStatus;
    logger.info(req.logEntry);

    res.json({ success, otp });
  },
);

export const send = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, id } = req.user || {};
    const otpModel: IOTP = new OTP({ userId: id });
    await otpModel.save();
    const otp = otpModel?.code?.toString();

    console.log('otp controller ____++++ warning message');

    await sendWarningEmail({
      email: email,
      ...emailTemplates.otpEmailConfirm,
    });

    res.json({ success: true, message: 'Confirm sent successfully on email' });
  },
);

export const verify = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { otp } = req.body || {};
    const { id } = req.user || {};

    if (!otp) {
      return next(new ErrorHandler('The otp is not defined.', 403));
    }

    const otpRecord: IOTP | null = await OTP.findOne({
      userId: id,
      code: otp,
    });

    if (otpRecord?.ip !== req.logEntry.ip_address) {
      return next(new ErrorHandler('OTP abuse detected.', 400));
    }

    if (!otpRecord) {
      return next(
        new ErrorHandler('The otp provided is invalid or has expired.', 400),
      );
    }

    return res.json({
      success: true,
      message: 'The otp has been successfully verified.',
    });
  },
);

// Confirm mail send
export const confirm = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { data } = req.query as { data: string };
    const user: IUser | null = await User.findOne({ email: data });

    if (!user) {
      return next(new ErrorHandler('User not found.', 404));
    }

    const otpModel: IOTP = new OTP({ userId: user.id });
    await otpModel.save();
    const otp = otpModel?.code?.toString();

    await sendEmail(
      {
        email: data,
        ...emailTemplates.otpEmailConfirm,
      },
      otp,
    );

    res.json({ success: true, otp, message: 'OTP sent successfully on email' });
  },
);
