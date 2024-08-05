import { Request, Response, NextFunction } from 'express';
import Reward, { IReward } from '../models/rewardModel'; // Adjust the import based on your Reward model
import Rank, { IRank } from '../models/rankModel'; // Adjust the import based on your Rank model
import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import ErrorHandler from '../utils/errorHandler';
import referralCtlr from './referralsController';
import { ObjectId } from 'mongodb';
import { firstDepositeDate, userSalesByQuery } from './transactionController';
import HELPERS from '../helpers';
import { create as rewardCtlrCreate } from '../controllers/rewardsController';
import moment from 'moment';

export const rank = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req?.user || {};
    const result = await getUserRankInfo(id);
    if (result) {
      if (HELPERS.checkRankPeriod(result.joiningDate)) {
        await rewardCtlrCreate(id, result, false);
      }
    }
    res.send({
      success: 'true',
      data: result,
    });
  },
);

export const findOne = async (query: any): Promise<IRank | null> => {
  return await Rank.findOne(query);
};

export const find = async (query: any): Promise<IRank[]> => {
  return await Rank.find(query);
};

export const getUserRankInfo = async (id: string | ObjectId) => {
  const userId = new ObjectId(id);

  // Joining day of this period
  const lastPeriodReward: IReward | null = await Reward.findOne({
    userId,
    isClaimed: false,
  })
    .sort({ _id: -1 })
    .limit(1);

  let joiningDate: Date | undefined; // Start of this rank's period

  if (lastPeriodReward) {
    joiningDate = new Date(lastPeriodReward?.createdAt);
  } else {
    const referrals =
      (await referralCtlr.getAllReferrals(
        {
          referralId: userId,
          isActive: true,
        },
        8,
      )) || [];

    for (const referral of referrals) {
      const firstDepositDate = await firstDepositeDate(referral._id);
      if (!joiningDate) joiningDate = firstDepositDate;
      else if (moment(joiningDate).isAfter(firstDepositDate)) {
        joiningDate = firstDepositDate;
      }
    }
  }

  if (!joiningDate) return {};

  // Start day of rank
  const lastReward: IReward | null = await Reward.findOne({
    userId: userId,
  })
    .sort({ _id: -1 })
    .limit(1);

  const startdate = new Date(lastReward?.createdAt || joiningDate);

  // Count of direct referrals
  const query = {
    referralId: userId,
    createdAt: {
      $gte: startdate,
    },
  };

  let counts = await referralCtlr.directReferralsCount(query);
  if (!lastReward) counts += 1;

  let inDirectCounts = await referralCtlr.indirectReferralsCount(query, 8);

  // Total sales of user in this period
  const depositQuery = {
    updatedAt: {
      $gte: startdate,
    },
  };

  const sales = await userSalesByQuery(userId, depositQuery);

  // Rank of this user
  const rankQuery = {
    directReferralsRequired: {
      $lte: counts,
    },
    requiredSalesFrom: {
      $lte: sales,
    },
  };

  const rank: IRank | null = await Rank.findOne(rankQuery).sort({ _id: -1 });

  return {
    joiningDate: new Date(startdate),
    directReferralsCount: counts,
    indirectReferralsCount: inDirectCounts,
    sumOfLast30DaysSales: sales,
    rank: rank ? rank.toObject() : {},
  };
};

const RankCtrl = {
  rank,
  findOne,
  find,
  getUserRankInfo,
};

export default RankCtrl;
