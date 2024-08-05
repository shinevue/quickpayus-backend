import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import verifyCaptcha from '../utils/recaptchaVerifier';
import User from '../models/userModel';
import ErrorHandler from '../utils/errorHandler';
import sendToken from '../utils/jWTToken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { sendEmail, emailTemplates } from '../utils/sendEmail';
import { Request, Response, NextFunction } from 'express';

// Define the request body interfaces
interface CreateUserRequest extends Request {
  body: {
    referral?: string;
    answer?: string;
    question?: number;
    [key: string]: any; // allow other properties
  };
}

interface SigninRequest extends Request {
  body: {
    password: string;
    email: string;
    recaptchaToken?: string;
    browser?: string;
    os?: string;
  };
}

interface DeleteUserRequest extends Request {
  body: {
    pwd: string;
    userId: string;
    check: boolean;
  };
}

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

interface ResetPasswordRequest extends Request {
  params: {
    token: string;
  };
  body: {
    password: string;
    confirmPassword: string;
  };
}

interface ChangePasswordRequest extends Request {
  body: {
    oldPassword: string;
    password: string;
  };
}

interface CheckDataExistRequest extends Request {
  body: {
    username?: string;
    email?: string;
    mobileNo?: string;
    countryCode?: string;
    recaptchaToken?: string;
  };
}

interface UsernameToNameRequest extends Request {
  body: {
    username: string;
    recaptchaToken?: string;
  };
}

interface DeactivateAccountRequest extends Request {
  body: {
    password: string;
  };
}

interface CheckRoleRequest extends Request {
  body: {
    username: string;
    password: string;
    email: string;
  };
}

interface CheckSecurityQuestionRequest extends Request {
  body: {
    question: string;
    answer: string;
  };
}

interface CheckBackupCodeRequest extends Request {
  body: {
    backupCode: string;
  };
}

export const checkAuth = catchAsyncErrors(async (req: any, res: Response) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
});

export const createUser = catchAsyncErrors(
  async (req: CreateUserRequest, res: Response, next: NextFunction) => {
    const { referral, answer, question } = req.body || {};
    let referralId: string | null = null;

    if (referral) {
      const parentUser = await User.findOne({ username: referral });
      if (parentUser) referralId = parentUser._id.toString();
    }

    if (!answer) {
      return next(new ErrorHandler('Answer is required', 400));
    }
    if (question && question < 0) {
      return next(new ErrorHandler('Question is required', 400));
    }

    const primaryColorsList = [
      '#007AFF',
      '#34C759',
      '#FF3B30',
      '#FFCC00',
      '#FF9500',
      '#00C7BE',
      '#FF2D55',
      '#AF52DE',
      '#5856D6',
    ];
    const secondaryColorsList = [
      '#D5E4F4',
      '#E7F8EB',
      '#FFE7E6',
      '#FFF9E0',
      '#FFF2E0',
      '#E0F8F7',
      '#FFE6EB',
      '#F5EAFB',
      '#EBEBFA',
    ];

    const randomIndex = Math.floor(Math.random() * primaryColorsList.length);
    const user: any = new User({
      ...req.body,
      securityQuestion: { answer, question },
      avatarBg: `linear-gradient(180deg, ${primaryColorsList[randomIndex]} 0%, ${secondaryColorsList[randomIndex]} 150%)`,
      referralId,
    });

    const codes = user.generateBackupCodes();

    const saved = await user.save();
    sendToken(saved, 200, res, { backupCode: codes, message: 'User Created' });
  },
);

export const signin = catchAsyncErrors(
  async (req: SigninRequest, res: Response, next: NextFunction) => {
    const { password, email, recaptchaToken, browser, os } = req.body;

    if (!email || !password) {
      return next(
        new ErrorHandler('Please enter email or username and password', 400),
      );
    }

    const user: any = await User.findOne({
      $or: [{ email }, { username: email }],
      isActive: true,
    }).select('+password');

    if (!user) {
      return next(new ErrorHandler('Invalid Credentials', 401));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler('Invalid Credentials', 401));
    }

    user.isDeleted = 0;
    user.browser = browser;
    user.os = os;
    await user.save();
    sendToken(user, 200, res, {});
  },
);

export const signout = catchAsyncErrors(async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Signed Out Successfully',
  });
});

export const deleteUser = catchAsyncErrors(
  async (req: DeleteUserRequest, res: Response, next: NextFunction) => {
    const { pwd, userId, check } = req.body;
    const user: any = await User.findById(userId).select('+password');

    const isPasswordMatched = await user.comparePassword(pwd);
    if (check) {
      if (!isPasswordMatched) {
        return next(new ErrorHandler('Wrong Password', 401));
      } else {
        return res.json({ success: true });
      }
    } else {
      await User.findByIdAndUpdate(
        userId,
        { isDeleted: 1, isDeletedAt: new Date() },
        { new: true },
      );
      res.json({ success: true });
    }
  },
);

export const forgotPassword = catchAsyncErrors(
  async (req: ForgotPasswordRequest, res: Response, next: NextFunction) => {
    const user: any = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new ErrorHandler('User not found', 404));
    }

    const resetToken = user.setResetPasswordToken();
    const resetPasswordUrl = `${req.protocol}://${req.get(
      'host',
    )}/auth/password/reset/${resetToken}`;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Forgot Password',
        message: resetPasswordUrl,
      });
      res.json({ success: true, message: 'SUCCESS' });
    } catch (error: any) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ErrorHandler(error, 500));
    }
  },
);

export const resetPassword = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { password, confirmPassword } = req.body;
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          'Reset password token is invalid or has been expired',
          400,
        ),
      );
    }

    if (password !== confirmPassword) {
      return next(
        new ErrorHandler('Password does not match with confirm password', 400),
      );
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Reset Password Successfully' });
  },
);

export const changePassword = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.user || {};
    const { oldPassword, password } = req.body || {};

    const user: any = await User.findById(id).select('+password');
    if (!user) {
      return next(
        new ErrorHandler(
          'User not found or not logged In. Please login and try again.',
          400,
        ),
      );
    }

    const isMatched = await user.comparePassword(oldPassword);
    if (!isMatched) {
      return next(
        new ErrorHandler(
          'Please enter correct old password and try again.',
          400,
        ),
      );
    }

    user.password = password;
    await user.save();

    res.json({ success: true, message: 'Password Changed Successfully' });
  },
);

export const checkDataExist = catchAsyncErrors(
  async (req: CheckDataExistRequest, res: Response, next: NextFunction) => {
    const { username, email, mobileNo, countryCode } = req.body || {};

    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return next(
        new ErrorHandler(
          'Email already exists. Please choose another to continue.',
          201,
        ),
      );
    }

    const usernameExist = await User.findOne({ username });
    if (usernameExist) {
      return next(
        new ErrorHandler(
          'Username already exists. Please choose another to continue.',
          201,
        ),
      );
    }

    const mobileNoExist = await User.findOne({
      $and: [{ countryCode }, { mobileNo }],
    });
    if (mobileNoExist) {
      return next(
        new ErrorHandler(
          'Phone number already exists. Please choose another to continue.',
          201,
        ),
      );
    }

    res.json({ success: true });
  },
);

export const usernameToName = catchAsyncErrors(
  async (req: UsernameToNameRequest, res: Response, next: NextFunction) => {
    const { username } = req.body || {};

    if (!username) {
      return next(new ErrorHandler('Invalid data provided', 201));
    }

    const user = await User.findOne({ username });
    if (!user) return res.json({ success: false });

    return res.json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  },
);

export const deactivateAccount = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.user || {};
    const { password } = req.body || {};

    const user: any = await User.findById(id).select('+password');
    if (!user) {
      return next(
        new ErrorHandler(
          'User not found or not logged In. Please login and try again.',
          400,
        ),
      );
    }

    const isMatched = await user.comparePassword(password);
    if (!isMatched) {
      return next(
        new ErrorHandler(
          'Please enter correct old password and try again.',
          400,
        ),
      );
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Account deactivated Successfully',
      data: user,
    });
  },
);

export const checkDeletedUser = async () => {
  const cutoffTime = Date.now() - 14 * 24 * 60 * 60 * 1000; // 14 days ago in milliseconds
  const resultUsers = await User.find({
    isDeleted: 1,
    isDeletedAt: { $lt: new Date(cutoffTime).toISOString() },
  });

  await User.deleteMany({ _id: { $in: resultUsers.map((user) => user._id) } });
};

export const checkRole = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { username, password, email } = req.body;

    const user: any = await User.findOne({ username, email }).select(
      '+password',
    );
    if (!user) {
      return next(new ErrorHandler('User not found', 400));
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      return next(new ErrorHandler('Invalid Credentials', 400));
    }

    if (email !== req.user.email) {
      return next(new ErrorHandler('Please enter your email.', 400));
    }

    res.send({ success: true, role: user.role });
  },
);

export const checkSecurityQuestion = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { question, answer } = req.body;
    const user = req.user;

    if (
      user?.securityQuestion?.question?.toString() !== question?.toString() ||
      user?.securityQuestion?.answer?.toString() !== answer?.toString()
    ) {
      return res.status(400).send({
        success: false,
        message: 'Invalid Security Question',
      });
    }

    res.send({
      success: true,
      message: 'Verified security question',
    });
  },
);

export const checkBackupCode = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { backupCode } = req.body;
    const user = req.user;

    const codeIndex = user.backupCodes.findIndex((code: string) =>
      bcrypt.compareSync(backupCode, code),
    );
    if (codeIndex === -1) {
      return res.status(400).send({
        success: false,
        message: 'Invalid Backup Code',
      });
    }

    user.backupCodes.splice(codeIndex, 1); // Remove the used code
    await user.save();

    res.send({
      success: true,
      message: 'Backup Code used successfully',
    });
  },
);
