import { Request, Response, NextFunction } from 'express';
import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import ErrorHandler from '../utils/errorHandler';
import Reward, { IReward } from '../models/rewardModel'; // Adjust the import based on your Reward model
// import { STATUS } from "../config/constants";
// import Rank from "../models/rankModel"; // Adjust the import based on your Rank model
import RankCtrl from './ranksController';
import { ObjectId } from 'mongodb';

export const get = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { type, page = 1 } = req.query as { type?: string; page?: number };
    const userId = req.user.id;
    const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;
    const query: any = {};

    if (type) {
      query.status = type;
    }

    const data: IReward[] = await Reward.find({ userId })
      .populate('userId')
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const total = await Reward.countDocuments(query);

    res.json({
      success: true,
      data,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  },
);

export const claimReward = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const userId = new ObjectId(req.user.id);
    const rankInfo = await RankCtrl.getUserRankInfo(userId);

    if (!Object.keys(rankInfo).length) {
      return next(new ErrorHandler('The rank period has not started.', 400));
    }

    if (!rankInfo.rank.hasOwnProperty('_id')) {
      return next(
        new ErrorHandler('The rank level has not been reached.', 400),
      );
    }

    const result = await create(userId, rankInfo, true);

    if (result) {
      res.status(200).json({
        success: true,
        data: {
          ...result,
          title: rankInfo.rank.title,
        },
      });
    } else {
      next(new ErrorHandler('Server error(claim)', 500));
    }
  },
);

export const create = async (
  userId: ObjectId,
  rankInfo: any,
  isClaimed: boolean,
) => {
  try {
    if (rankInfo.rank && Object.keys(rankInfo.rank).length) {
      const rankId = rankInfo.rank._id;
      const { rewardFrom, rewardTo, requiredSalesFrom, requiredSalesTo } =
        rankInfo.rank;

      const amount = rewardAmount(
        rewardFrom,
        rewardTo,
        requiredSalesFrom,
        requiredSalesTo,
        rankInfo.sumOfLast30DaysSales,
      );

      const reward = new Reward({
        userId,
        rankId,
        amount,
        isClaimed,
        sales: rankInfo.sumOfLast30DaysSales,
        directCount: rankInfo.directReferralsCount,
        indirectCount: rankInfo.indirectReferralsCount,
      });

      return await reward.save();
    } else {
      const reward = new Reward({
        userId,
        isClaimed,
      });
      return await reward.save();
    }
  } catch (error) {
    return null;
  }
};

function rewardAmount(
  rewardMin: number,
  rewardMax: number,
  requireMin: number,
  requireMax: number,
  sales: number,
): number {
  if (requireMax <= sales) return rewardMax;
  if (requireMin > sales) return 0;

  return (
    ((rewardMax - rewardMin) * (sales - requireMin)) /
      (requireMax - requireMin) +
    rewardMin
  );
}
const rewardCtlr = {
  get,
  claimReward,
  create,
};

export default rewardCtlr;
