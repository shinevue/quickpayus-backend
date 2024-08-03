import mongoose, { Document, Model } from 'mongoose';
import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import Reward, { IReward } from '../../models/rewardModel'; // Adjust the import based on your Reward model
import User from '../../models/userModel'; // Adjust the import based on your User model
import ErrorHandler from '../../utils/errorHandler';
import { create } from '../../services/notificationService';
import { Request, Response, NextFunction } from 'express';
import config from '../../config/constants';

export const get = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      status,
      criteria,
      searchQuery,
      page = 1,
    } = req.query as {
      status?: string;
      criteria?: string;
      searchQuery?: string;
      page?: number;
    };

    const pageSize = parseInt(process.env.RECORDS_PER_PAGE || '15', 10);
    let query: any = {};

    if (status) query.status = status;

    let matchCriteria: any = {};

    if (criteria === 'claimedRewards') {
      matchCriteria.isClaimed = true;
    } else if (criteria === 'amount') {
      matchCriteria.sales = { $gte: parseFloat(searchQuery || '0') };
    } else if (criteria === 'date') {
      matchCriteria.date = { $gte: new Date(searchQuery || '0') };
    }

    const ranks = await Reward.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $match:
          criteria === 'user' && searchQuery
            ? { 'user.username': { $regex: searchQuery, $options: 'i' } }
            : {},
      },
      {
        $lookup: {
          from: 'ranks',
          localField: 'rankId',
          foreignField: '_id',
          as: 'rank',
        },
      },
      {
        $unwind: '$rank',
      },
      {
        $project: {
          rewardId: '$_id',
          id: '$user._id',
          name: '$user.username',
          directReferrals: '$directCount',
          indirectReferrals: '$indirectCount',
          reward: '$amount',
          sales: '$sales',
          status: '$status',
          rank: '$rank.title',
          date: '$updatedAt',
          isClaimed: '$isClaimed',
        },
      },
      {
        $match: matchCriteria,
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: pageSize,
      },
    ]);

    const totalCount = await Reward.countDocuments(query);

    res.json({
      success: true,
      ranks,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  },
);

export const update = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, rewardId, reason } = req.body;
      const authId = req.user?.id;

      if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
        return next(new ErrorHandler('Invalid Reward Id', 400));
      }
      if (!status) {
        return next(new ErrorHandler('Status is required', 400));
      }

      // Find the reward to update
      const reward = await Reward.findOne({
        _id: rewardId,
        status: config.STATUS.PENDING,
      });

      if (!reward) {
        return next(new ErrorHandler(`No pending reward found`, 404));
      }

      const { userId, amount } = reward;

      if (status === config.STATUS.REJECTED) {
        if (!reason) {
          return next(
            new ErrorHandler(`Reason is required for rejected status`, 400),
          );
        }
        await Reward.findByIdAndUpdate(rewardId, {
          status,
          reason,
          isClaimed: false,
          adminId: authId,
        });
        await create({
          userId,
          type: config.NOTIFICATION_TYPES.ACTIVITY,
          message: `Your reward has been rejected for the following reason: ${reason}`,
        });
        return res.json({
          success: true,
          message: 'Reward updated successfully',
        });
      }

      await Reward.findByIdAndUpdate(rewardId, {
        status,
        adminId: authId,
      });
      await User.findByIdAndUpdate(userId, { $inc: { rewardBalance: amount } });
      const message = `${amount} has been successfully rewarded.`;
      await create({
        userId,
        type: config.NOTIFICATION_TYPES.ACTIVITY,
        message,
      });

      return res.json({
        success: true,
        message: 'Reward updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  },
);

export const countDocuments = async (query: any): Promise<number> => {
  return await Reward.countDocuments(query);
};

export const find = async (query: any): Promise<IReward[]> => {
  return await Reward.find(query);
};

export const findOne = async (query: any): Promise<IReward | null> => {
  return await Reward.findOne(query);
};
