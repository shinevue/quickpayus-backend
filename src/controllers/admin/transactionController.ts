import mongoose, { Document } from 'mongoose';
import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import Transaction from '../../models/transactionModel';
import User from '../../models/userModel';
import ErrorHandler from '../../utils/errorHandler';
import { sendEmail } from '../../utils/sendEmail';
import programCtlr from '../programController';
import referralCtlr from '../referralsController';
import userCtlr from '../userController';
import notificationService from '../../services/notificationService';
import HEPLERS from '../../helpers/index';
import { ObjectId } from 'mongodb';
import config from '../../config/constants';
import { Request, Response, NextFunction } from 'express';
import { IProgram } from '../../models/ProgramModel';

// Define the structure of a transaction document
interface ITransaction extends Document {
  userId: string;
  originalAmount: number;
  amount: number;
  feesAmount: number;
  uuid: string;
  transactionType: string;
  withdrawalType: string;
  status: string;
  createdAt: Date;
}

// Define the structure of the request body for the update method
interface IUpdateTransactionBody {
  status: string;
  transactionId: string;
  reason?: string;
}

export const get = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      type,
      status,
      page = 1,
    } = req.query as { type?: string; status?: string; page?: number };
    const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;
    let query: any = {};

    if (type) query.transactionType = type;
    if (status) query.status = status;

    const transactions = await Transaction.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          date: '$createdAt',
          user: '$user.username',
          transactionId: '$_id',
          type: '$transactionType',
          status: '$status',
          amount: '$amount',
        },
      },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ]);

    const totalCount = await countDocuments(query);
    res.json({
      success: true,
      transactions,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize), // Fixed the calculation of totalPages
    });
  },
);

export const update = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { status, transactionId, reason } =
      req.body as IUpdateTransactionBody;
    const authId = req.user?.id;

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new ErrorHandler('Transaction Id is invalid', 400);
    }
    if (!status) {
      throw new ErrorHandler('Please provide status', 400);
    }

    // Find the transaction to update
    const transaction = await findOne({
      _id: transactionId,
      status: config.STATUS.PENDING,
    });
    if (!transaction) {
      throw new ErrorHandler(
        `No ${config.STATUS.PENDING.toLowerCase()} transaction not found`,
        404,
      );
    }

    const {
      userId,
      originalAmount,
      amount,
      feesAmount,
      uuid,
      transactionType,
      withdrawalType,
    } = transaction;

    if (status.includes(config.STATUS.REJECTED)) {
      console.log('PASSED');

      if (!reason) {
        return next(
          new ErrorHandler(
            `The reason must be provided for ${config.STATUS.REJECTED} case!`,
            400,
          ),
        );
      }
      await Transaction.findByIdAndUpdate(transactionId, {
        status,
        reason,
        adminId: authId,
      });

      if (transactionType.includes(config.TRANSACTION_TYPES.WITHDRAWAL)) {
        const { key, balance } = await userCtlr.balanceByType({
          userId,
          withdrawalType,
        });
        await User.findByIdAndUpdate(userId, {
          $set: { [key]: balance + originalAmount },
        });
      }

      let message = `Unfortunately, your ${transactionType.toLowerCase()} of $${originalAmount} has been ${config.STATUS.REJECTED.toLowerCase()}. If you have any questions, please contact support. ${uuid}`;
      notificationService.create({
        userId,
        title: config.NOTIFICATION_TYPES.ACTIVITY,
        type: config.NOTIFICATION_TYPES.ACTIVITY,
        message,
      });

      return res.json({
        success: true,
        message: 'Transaction updated successfully',
      });
    }

    await Transaction.findByIdAndUpdate(transactionId, {
      status,
      adminId: authId,
    });

    let keyToUpdate = null;
    let balance = 0;
    const userUpdate: any = {};
    let message = `The ${transactionType.toLowerCase()} of $${originalAmount} has been successfully processed and ${config.STATUS.PENDING.toLowerCase()}. Please note, a ${
      config.DEFAULT_FEE_AMOUNT
    }% fee has been deducted, resulting in a net amount of $${amount}. ${uuid}`;

    if (transactionType.includes(config.TRANSACTION_TYPES.DEPOSIT)) {
      const balanceResponse = await userCtlr.balanceByType({
        userId,
        transactionType,
      });
      keyToUpdate = balanceResponse?.key;
      balance = amount + balanceResponse?.balance;
      userUpdate.$set = {
        [keyToUpdate]: balance,
      };
      const program = await programCtlr.findByInvestment(
        originalAmount + balanceResponse?.balance,
      );
      userUpdate.investmentLevel = program?.level || null;
      userUpdate.investmentSubLevel = program?.data?.level || null;
    } else if (transactionType.includes(config.TRANSACTION_TYPES.WITHDRAWAL)) {
      const balanceResponse = await userCtlr.balanceByType({
        userId,
        withdrawalType,
      });
      balance = balanceResponse?.balance;
      message = `Your ${transactionType.toLowerCase()} of $${originalAmount} has been ${config.STATUS.APPROVED.toLowerCase()}. Please note, a ${
        config.DEFAULT_FEE_AMOUNT
      }% fee has been deducted. ${uuid}`;
      switch (withdrawalType) {
        case config.WITHDRAWAL_TYPES.DEPOSIT:
          const program = await programCtlr.findByInvestment(balance);
          userUpdate.investmentLevel = program?.level || null;
          userUpdate.investmentSubLevel = program?.data?.level || null;
          break;
      }
    }

    const user = await User.findByIdAndUpdate(userId, userUpdate);
    if (transactionType.includes(config.TRANSACTION_TYPES.DEPOSIT)) {
      await updateCreditToParents(user, transactionType, balance);
    }

    notificationService.create({
      userId,
      title: config.NOTIFICATION_TYPES.ACTIVITY,
      type: config.NOTIFICATION_TYPES.ACTIVITY,
      message,
    });

    return res.json({
      success: true,
      message: 'Transaction updated successfully',
    });
  },
);

export const updateCreditToParents = async (
  user: any,
  type: string,
  amount: number,
) => {
  const parentReferralsQuery = {
    _id: new ObjectId(user?._id),
    isActive: true,
  };
  const parentReferrers = await referralCtlr.parentReferrers(
    parentReferralsQuery,
  );

  for (const parent of parentReferrers) {
    if (!parent?.investmentLevel && !parent?.investmentSubLevel) {
      continue;
    }
    const program = await programCtlr.findByLevels({
      level: parent?.investmentLevel,
      sublevel: parent?.investmentSubLevel,
    });
    if (!program?.data?.creditPercentage) continue;

    const appliedCreditPercentage = HEPLERS.applyPercentage(
      amount,
      program?.data?.creditPercentage,
    );
    const userUpdate = {
      $set: {
        referralCreditBalance:
          (parent?.referralCreditBalance || 0) + appliedCreditPercentage,
      },
    };
    const parentId = new ObjectId(parent?._id);
    await User.findByIdAndUpdate(parentId, userUpdate);
    notificationService.create({
      userId: parent?._id,
      title: config.NOTIFICATION_TYPES.ACTIVITY,
      type: config.NOTIFICATION_TYPES.ACTIVITY,
      message: `Congratulations! You've successfully earned a credit of $${appliedCreditPercentage} through your referral from: ${user?.username}. This credit has been added to your account.`,
    });
  }
};

export const countDocuments = async (query: any): Promise<number> => {
  return await Transaction.countDocuments(query);
};

export const find = async (query: any): Promise<ITransaction[]> => {
  return await Transaction.find(query);
};

export const findOne = async (query: any): Promise<ITransaction | null> => {
  return await Transaction.findOne(query);
};

export const totalSumByKey = async (key: string): Promise<number> => {
  const response = await Transaction.aggregate([
    {
      $match: {
        status: config.STATUS.APPROVED,
        transactionType: {
          $in: [
            config.TRANSACTION_TYPES.DEPOSIT,
            config.TRANSACTION_TYPES.WITHDRAWAL,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        sumOfKey: { $sum: key },
      },
    },
  ]);
  return response.length ? response[0]?.sumOfKey : 0;
};
