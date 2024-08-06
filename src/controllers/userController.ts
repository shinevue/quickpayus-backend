import config from '../config/constants';
import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import User, { IUser } from '../models/userModel';
import ErrorHandler from '../utils/errorHandler';
import path from 'path';
import fs from 'fs/promises';
import notificationService from '../services/notificationService';
import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongoose';

interface KYCData {
  images?: Array<{ name: string }>;
  documents?: Array<{ name: string }>;
}

interface BalanceQuery {
  userId?: string | ObjectId;
  withdrawalType?: string;
  transactionType?: string;
}

export const kycUpsert = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const userID = req.user.id;
    let user = await User.findById(userID);
    if (user) {
      if (req.files && Object.keys(req.files).length > 0) {
        if (user.kyc && user.kyc.images) {
          // Delete previous image files
          await Promise.all(
            user.kyc.images.map(async (file) => {
              const filePath = path.join(
                __dirname,
                `../../uploads/kyc/${user?.username}`,
                file.name,
              );
              try {
                await fs.unlink(filePath);
              } catch (err) {
                console.error(`Error deleting file ${filePath}: ${err}`);
              }
            }),
          );
        }

        if (user.kyc && user.kyc.documents) {
          // Delete previous document files
          await Promise.all(
            user.kyc.documents.map(async (file) => {
              const filePath = path.join(
                __dirname,
                `../../uploads/kyc/${user?.username}`,
                file.name,
              );
              try {
                await fs.unlink(filePath);
              } catch (err) {
                console.error(`Error deleting file ${filePath}: ${err}`);
              }
            }),
          );
        }

        const imageFiles = req.files.images || [];
        const documentFiles = req.files.documents || [];

        // Ensure the user's KYC directory exists
        const userDir = path.join(__dirname, `../../uploads/kyc/${user.username}`);
        await fs.mkdir(userDir, { recursive: true });

        req.body.images = await Promise.all(
          imageFiles.map(async (file: any) => {
            const destPath = path.join(userDir, file.filename);
            await fs.rename(file.path, destPath);
            return { name: file.filename };
          }),
        );

        req.body.documents = await Promise.all(
          documentFiles.map(async (file: any) => {
            const destPath = path.join(userDir, file.filename);
            await fs.rename(file.path, destPath);
            return { name: file.filename };
          }),
        );
      }

      user = await User.findByIdAndUpdate(
        userID,
        { kyc: { ...req.body } },
        { new: true },
      );

      notificationService.create({
        userId: user?.username,
        title: 'KYC updated',
        message:
          'Your KYC verification has been submitted. Please allow up to 72 hours for approval.',
        type: config.NOTIFICATION_TYPES.IMPORTANT,
      });

      res.status(200).json({
        success: true,
        message: 'KYC updated successfully',
        data: user,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
  },
);

export const updateProfile = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const userID = req.user.id;
    const { password, ...data } = req.body;
    const user: any = await User.findById(userID).select('+password');

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
        new ErrorHandler('Please enter correct password and try again.', 400),
      );
    }

    for (const key of Object.keys(data)) {
      const isSame = await user.compareField({ [key]: data[key] });
      if (isSame) {
        return next(
          new ErrorHandler(`Please enter a new ${key} and try again.`, 400),
        );
      }
      user[key] = data[key];
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  },
);

export const enable2FA = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const userID = req.user.id;
    const user = await User.findById(userID);

    if (!user) {
      return next(
        new ErrorHandler(
          'User not found or not logged In. Please login and try again.',
          400,
        ),
      );
    }

    user.isEnableMFA = req.body.checked;

    await user
      .save()
      .then(() => {
        res.status(200).json({
          success: true,
          message: 'MFA status was changed successfully',
          user,
        });
      })
      .catch(() => {
        res.status(500).json({
          success: false,
          message: "MFA status wasn't changed successfully",
        });
      });
  },
);

export const balanceByType = async (query: BalanceQuery) => {
  let balance = 0;
  let key: string = '';

  if (!query?.userId) {
    switch (query?.withdrawalType) {
      case config.WITHDRAWAL_TYPES.DEPOSIT:
        key = 'depositBalance';
        break;
      case config.WITHDRAWAL_TYPES.PROFIT:
        key = 'profitBalance';
        break;
      case config.WITHDRAWAL_TYPES.REWARD:
        key = 'rewardBalance';
        break;
    }
    return { key, balance };
  }

  const user = await User.findById(query?.userId);

  if (user) {
    switch (query?.withdrawalType) {
      case config.WITHDRAWAL_TYPES.DEPOSIT:
        key = 'depositBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
      case config.WITHDRAWAL_TYPES.PROFIT:
        key = 'profitBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
      case config.WITHDRAWAL_TYPES.REWARD:
        key = 'rewardBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
    }

    switch (query?.transactionType) {
      case config.TRANSACTION_TYPES.DEPOSIT:
        key = 'depositBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
      case config.TRANSACTION_TYPES.PROFIT:
        key = 'profitBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
      case config.TRANSACTION_TYPES.REFERRAL_CREDIT:
        key = 'creditBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
      case config.TRANSACTION_TYPES.REWARD:
        key = 'rewardBalance';
        balance = user[key as keyof IUser] ?? 0;
        break;
    }
  }

  return { key, balance };
};

export const getUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const uuid = req?.params?.uuid;
    const data = await User.findOne({ uuid });

    if (!data) {
      return next(new ErrorHandler('No user found.', 404));
    }

    res.json({
      success: true,
      data,
    });
  },
);

export const getAllUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const keyword = req.params.key;
    const users = await User.find({
      $or: [
        { email: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } },
      ],
    });

    res.json({ users });
  },
);

const userCtlr = {
  kycUpsert,
  updateProfile,
  enable2FA,
  balanceByType,
  getUser,
  getAllUser,
};

export default userCtlr;
