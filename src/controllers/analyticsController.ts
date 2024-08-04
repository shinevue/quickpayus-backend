import moment from 'moment';
import { ObjectId } from 'mongodb';
// import User from "../models/userModel";
// import HELPER from "../helpers/index";
import config from '../config/constants';
// import programCtlr from "./programController";
// import referralCtlr from "./referralsController";
import { userCreditBalanceByQuery } from './transactionController';
import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import { Request, Response, NextFunction } from 'express';

interface UserRequest extends Request {
  user: {
    id: string;
    depositBalance: number;
    profitBalance: number;
    referralCreditBalance: number;
    rewardBalance: number;
  };
}

interface BalanceInformation {
  accountBalance: number;
  profitBalance: number;
  depositBalance: number;
  equityBalance: number;
  creditBalance: number;
  rankRewardBalance: number;
}

export const counts = catchAsyncErrors(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    const defaultResponse: BalanceInformation = {
      accountBalance: user.depositBalance + user.profitBalance,
      profitBalance: user.profitBalance,
      depositBalance: user.depositBalance,
      equityBalance: user.referralCreditBalance + user.depositBalance,
      creditBalance: user.referralCreditBalance,
      rankRewardBalance: user.rewardBalance,
    };
    res.json(defaultResponse);
  },
);

export const getBalanceInformation = catchAsyncErrors(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const userId = new ObjectId(req.user.id) || null;
    const { balanceframe, timeframe } = req.params;
    const balanceInformation: any[] = []; // Adjust type as necessary
    const dateQueries = generateDateQuery(timeframe);
    let userBalanceFunction: Function;

    switch (balanceframe) {
      case config.ANALYTICS_TYPE.CREDIT:
        userBalanceFunction = userCreditBalanceByQuery;
        break;
      case config.ANALYTICS_TYPE.PROFIT:
        userBalanceFunction = userCreditBalanceByQuery;
        break;
      case config.ANALYTICS_TYPE.REWARD:
        userBalanceFunction = userCreditBalanceByQuery;
        break;
      default:
        return next(new Error('Invalid balance frame'));
    }

    for (let i = 0; i < dateQueries.length; i++) {
      balanceInformation.push(
        await userBalanceFunction(userId, {
          createdAt: dateQueries[i],
        }),
      );
    }

    res.status(200).json(balanceInformation);
  },
);

function generateDateQuery(timeframe: string): { $gte: Date; $lte: Date }[] {
  const dateQueries: { $gte: Date; $lte: Date }[] = [];
  let start: moment.Moment;
  let end: moment.Moment;
  let last: moment.Moment;
  let unit: moment.unitOfTime.DurationConstructor;

  switch (timeframe) {
    case 'day':
      unit = 'days';
      start = moment().startOf('month');
      last = moment().endOf('month');
      break;
    case 'week':
      unit = 'weeks';
      start = moment().startOf('month');
      last = moment().endOf('month');
      break;
    case 'month':
      unit = 'months';
      start = moment().startOf('year');
      last = moment().endOf('year');
      break;
    default:
      throw new Error('Invalid date type');
  }

  while (start.isBefore(last)) {
    end = moment(start).add(1, unit);
    dateQueries.push({
      $gte: start.toDate(),
      $lte: end.toDate(),
    });
    start = end;
  }

  return dateQueries;
}
