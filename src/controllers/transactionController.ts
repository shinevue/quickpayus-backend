import { ObjectId as ObjectIdType } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';
import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import programCtlr from './programController';
import userCtlr from './userController';
import referralCtlr from './referralsController';
// import rewardCtlr from './rewardsController';
import Reward from '../models/rewardModel'; // , { IReward }
import Transaction, { ITransaction } from '../models/transactionModel'; // Adjust the import based on your Transaction model
import notificationService from '../services/notificationService';
import User from '../models/userModel'; // , { IUser }
import ErrorHandler from '../utils/errorHandler';
import { isValidAddress } from '../utils/trc20Validator';
import HELPERS from '../helpers';
import config from '../config/constants';
import Receiver from '../models/receiverAddressModel';

const get = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { id, role } = req?.user || {};
    const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;
    const q = req?.query || {};
    const {
      page = 1,
      status,
      transactionType,
      from,
      to,
      search,
    } = q as {
      page?: number;
      status?: string;
      transactionType?: string;
      from?: string;
      to?: string;
      search?: string;
    };

    const query: any = {};

    if (search) {
      const regexSearchTerm = new RegExp(search, 'i');
      query.uuid = { $regex: regexSearchTerm };
    }

    if (!role?.includes('admin')) {
      query.userId = id;
    }

    const currentDate = new Date();

    if (from && to) {
      const toDate = new Date(to);
      query.createdAt = {
        $gte: new Date(from).toISOString(),
        $lte: new Date(toDate.setDate(toDate.getDate() + 1)).toISOString(),
      };
    }

    if (from && !to) {
      query.createdAt = {
        $gte: new Date(from).toISOString(),
        $lte: new Date(currentDate.setHours(17, 0, 0, 0)).toISOString(),
      };
    }

    if (transactionType) query.transactionType = transactionType;
    if (status) query.status = status;

    const data: ITransaction[] = await paginate(query, { page, pageSize });
    const total = (await countDocuments(query)) ?? 0;

    if (!data?.length) {
      return res.json({
        success: false,
        data,
      });
    }

    return res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / pageSize),
      data,
    });
  },
);

const getAddress = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await Receiver.find().sort({ createdAt: -1 }).limit(1);
    console.log('data: ', data[0]);
    return res.json({
      success: true,
      address: data[0],
    });
  },
);

const create = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const {
      amount,
      receiverAddress,
      senderAddress,
      transactionType,
      withdrawalType,
    }: {
      amount: number;
      receiverAddress: string;
      senderAddress: string;
      transactionType: string;
      withdrawalType: string;
    } = req.body || {};

    const { kyc, id }: { kyc: any; id: ObjectIdType } = req?.user || {};

    if (!(transactionType in config.TRANSACTION_TYPES)) {
      return next(
        new ErrorHandler(
          'The transaction type does not seem to be recognised by our system.',
          400,
        ),
      );
    }

    if (!isValidAddress(receiverAddress)) {
      return next(
        new ErrorHandler('Receiver address is invalid. Please try again.', 400),
      );
    }

    if (!isValidAddress(senderAddress)) {
      return next(
        new ErrorHandler('Sender address is invalid. Please try again.', 400),
      );
    }

    const payload: {
      amount: number;
      userId: ObjectIdType;
      receiverAddress: string;
      senderAddress: string;
      transactionType: string;
      withdrawalType: string;
      uuid: string;
    } = {
      amount,
      userId: id,
      receiverAddress,
      senderAddress,
      transactionType,
      withdrawalType,
      uuid: 'null',
    };

    switch (transactionType) {
      case config.TRANSACTION_TYPES.WITHDRAWAL:
        if (!kyc || !kyc?.status) {
          return next(
            new ErrorHandler(
              'Kindly complete your KYC verification prior to initiating the withdrawal process.',
              400,
            ),
          );
        }
        if (amount <= config.MINIMUM_WITHDRAWAL_AMOUNT) {
          return next(
            new ErrorHandler(
              `The withdrawal amount must be a minimum of $${config.MINIMUM_WITHDRAWAL_AMOUNT}.`,
              400,
            ),
          );
        }
        if ([config.STATUS.REJECTED].includes(kyc?.status)) {
          return next(
            new ErrorHandler(
              `Your KYC verification did not meet our requirements. Please review and re-submit.`,
              400,
            ),
          );
        }
        if ([config.STATUS.PENDING].includes(kyc?.status)) {
          return next(
            new ErrorHandler(
              `Your KYC verification is currently under review. We will notify you once it's completed.`,
              400,
            ),
          );
        }
        if (!(withdrawalType in config.WITHDRAWAL_TYPES)) {
          return next(
            new ErrorHandler(
              'The withdrawal type does not seem to be recognised by our system.',
              400,
            ),
          );
        }

        const { key, balance } = await userCtlr.balanceByType({
          userId: id,
          withdrawalType,
        });

        if (amount > balance) {
          return next(
            new ErrorHandler(
              `You have insufficient balance in your account.`,
              400,
            ),
          );
        }

        const finalAmount = balance - amount;
        if (key)
          await User.findByIdAndUpdate(id, { $set: { [key]: finalAmount } });
        break;

      case config.TRANSACTION_TYPES.DEPOSIT:
        const program = await programCtlr.findOne(
          { 'data.investment': Number(amount) },
          // { 'data.investment': 1, _id: 0 },
        );

        if (!program) {
          return next(
            new ErrorHandler(
              'Invalid investment amount. Please try again.',
              400,
            ),
          );
        }
        break;
    }

    const transaction = await save(payload);
    await notificationService.create({
      userId: id,
      title: 'DEPOSIT SUCCESSFULLY!',
      type: config.NOTIFICATION_TYPES.ACTIVITY,
      message: `${transaction?.transactionType
        ?.toLowerCase()
        ?.capitalizeFirst()} of amount $${amount} is now in ${transaction?.status?.toLowerCase()} state. The transaction status will be updated within 3 working days. ${
        transaction?.uuid
      }`,
    });

    res.json({
      success: true,
      message: 'Transaction created successfully',
    });
  },
);

const find = async (query: any) => {
  return Transaction.find(query);
};

const userSum = async (query: any, key: string) => {
  const result = await Transaction.aggregate([
    {
      $match: query,
    },
    {
      $group: {
        _id: null,
        sumOfKey: { $sum: key },
      },
    },
  ]);

  if (result.length > 0) return result[0].sumOfKey;
  return 0;
};

const save = async (payload: any) => {
  const transaction = new Transaction(payload);
  return await transaction.save();
};

const findOne = async (query: any) => {
  return await Transaction.findOne(query);
};

const paginate = async (
  query: any,
  options: { page: number; pageSize: number },
) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

const countDocuments = async (query: any) => {
  return await Transaction.countDocuments(query);
};

const userDepositlBalanceByQuery = async (userId: any, query = {}) => {
  if (!userId) return 0;

  const depositQuery = {
    userId: userId,
    status: {
      $in: [config.STATUS.APPROVED],
    },
    transactionType: {
      $in: [config.TRANSACTION_TYPES.DEPOSIT],
    },
    ...query,
  };

  const depositResult = (await userSum(depositQuery, '$amount')) ?? 0;

  const withdrawalQuery = {
    userId: userId,
    status: {
      $in: [config.STATUS.APPROVED, config.STATUS.PENDING],
    },
    transactionType: {
      $in: [config.TRANSACTION_TYPES.WITHDRAWAL],
    },
    withdrawalType: {
      $in: [config.WITHDRAWAL_TYPES.DEPOSIT],
    },
    ...query,
  };

  const withdrawResult =
    (await userSum(withdrawalQuery, '$originalAmount')) ?? 0;

  return depositResult - withdrawResult;
};

const userProfitBalanceByQuery = async (userId: string, query = {}) => {
  if (!userId) return 0;

  const profitQuery = {
    userId: userId,
    status: {
      $in: [config.STATUS.APPROVED],
    },
    transactionType: {
      $in: [config.TRANSACTION_TYPES.PROFIT],
    },
    ...query,
  };

  const withdrawalQuery = {
    userId: userId,
    status: {
      $in: [config.STATUS.APPROVED, config.STATUS.PENDING],
    },
    transactionType: {
      $in: [config.TRANSACTION_TYPES.PROFIT],
    },
    withdrawalType: {
      $in: [config.WITHDRAWAL_TYPES.PROFIT],
    },
    ...query,
  };

  const profitResult = (await userSum(profitQuery, '$amount')) ?? 0;
  const withdrawResult =
    (await userSum(withdrawalQuery, '$originalAmount')) ?? 0;

  return profitResult - withdrawResult;
};

const userCreditBalanceByQuery = async (userId: string, moreQuery = {}) => {
  if (!userId) return 0;

  const user = await User.findOne({ _id: userId });
  if (!user) return 0;

  const program = await programCtlr.findOne({
    level: user?.investmentLevel,
  });

  let creditBalance = 0;

  const referrals =
    (await referralCtlr.getAllReferrals(
      { referralId: userId, isActive: true },
      config.REFERRAL_DEPTH,
    )) || [];

  for (const referral of referrals) {
    const query = {
      userId: referral._id,
      status: config.STATUS.APPROVED,
      ...moreQuery,
    };

    const transactions = await find(query);
    if (!transactions?.length) continue;

    const sumOfAmount = transactions?.reduce((total, { amount }) => {
      return total + amount;
    }, 0);

    const subProgram = program?.data?.find((row) => {
      if (referral?.sublevel == row?.level) {
        return row;
      }
    });

    if (!subProgram) continue;

    const appliedPercentage = HELPERS.applyPercentage(
      sumOfAmount,
      Number(subProgram?.creditPercentage),
    );

    creditBalance += appliedPercentage;
  }

  return creditBalance;
};

const userEquityBalanceByQuery = async (userid: string, query = {}) => {
  return (
    (await userCreditBalanceByQuery(userid, query)) +
    (await userDepositlBalanceByQuery(userid, query))
  );
};

const userAccountBalanceByQuery = async (userid: string, query = {}) => {
  return (
    (await userProfitBalanceByQuery(userid, query)) +
    (await userDepositlBalanceByQuery(userid, query))
  );
};

const userRewardBalanceByQuery = async (userid: string, query = {}) => {
  const rewardQuery = {
    userId: userid,
    status: {
      $in: [config.STATUS.APPROVED, config.STATUS.PENDING],
    },
    ...query,
  };

  const result = await Reward.aggregate([
    {
      $match: rewardQuery,
    },
    {
      $group: {
        _id: null,
        sumOfKey: { $sum: '$amount' },
      },
    },
  ]);

  if (result.length > 0) return result[0].sumOfKey;
  return 0;
};

// getting data for sales analytic chart
const getAllTrans = async (req: any, res: Response) => {
  const { id } = req.user;
  const userId = new ObjectId(id);
  const query = {
    referralId: userId,
    isActive: true,
  };

  const referrals = (await referralCtlr.getAllReferrals(query, 8)) || [];
  let transactions: ITransaction[] = [];

  for (const referral of referrals) {
    const depositQuery = {
      status: config.STATUS.APPROVED,
      userId: referral?._id,
    };

    const result = await Transaction.find(depositQuery);
    if (result.toString().length != 0) {
      transactions.push(...result);
    }
  }

  if (req.params.key === 'month') {
    const monthlyData: { [key: string]: number } = {};
    transactions.forEach((item) => {
      const date = new Date(item.createdAt);
      const formattedDate = `${padZero(date.getMonth() + 1)}`;
      if (!monthlyData[formattedDate]) {
        monthlyData[formattedDate] = 0;
      }
      monthlyData[formattedDate] += item.amount;
    });

    const arr = Object.entries(monthlyData).map(([key, value]) => [key, value]);
    const monthResult = Array(12).fill(0);

    for (let i = 0; i < 12; i++) {
      arr.forEach((arrItem) => {
        let itemMonth = Number(arrItem[0].toString());
        if (i === itemMonth - 1) {
          monthResult[i] = arrItem[1];
        }
      });
    }

    return res.json({ monthResult });
  } else {
    const dailyData: { [key: string]: number } = {};
    transactions.forEach((item) => {
      const date = new Date(item.createdAt);
      const formattedDate = `${padZero(date.getDate())}`;
      if (!dailyData[formattedDate]) {
        dailyData[formattedDate] = 0;
      }
      dailyData[formattedDate] += item.amount;
    });

    const dailyDataArray = Object.entries(dailyData).map(([key, value]) => ({
      [key]: value,
    }));

    const convertedDailyDate = dailyDataArray.map((str) => {
      let temp = JSON.stringify(str);
      temp = temp.slice(1, temp.length - 1);
      let day = temp.split(':')[0];
      day = day.slice(1, day.length - 1);
      const amount = temp.split(':')[1];
      return [Number(day), Number(amount)];
    });

    let currentDate = new Date();
    let monthNumber = currentDate.getMonth();
    let months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let initialArrayDay = new Array(months[monthNumber]).fill(0);
    let index = 0;

    for (index; index < initialArrayDay.length; index++) {
      convertedDailyDate.forEach((item) => {
        if (index === item[0]) {
          initialArrayDay[index] = item[1];
        }
      });
    }

    if (req.params.key === 'day') {
      return res.json({ initialArrayDay });
    } else if (req.params.key === 'week') {
      let flag = 0;
      let weekResult: number[] = [];
      let temp = 0;

      initialArrayDay.forEach((item) => {
        if (flag < 6) {
          temp += item;
          flag++;
        } else {
          weekResult.push(temp);
          temp = 0;
          flag = 0;
        }
      });

      weekResult[weekResult.length - 1] =
        weekResult[weekResult.length - 1] + temp;

      return res.json({ weekResult });
    }
  }
};

const padZero = (num: number) => {
  return num.toString().padStart(2, '0');
};

/**
 *
 * @param {ObjectIdType} userId  for which you want to get sales volume
 * @param {object} moreQuery more info to get sales
 * @returns {Promise<Number>} sales volume of user
 */
const userSalesByQuery = async (userId: any, moreQuery: any) => {
  if (!userId) return 0;

  const user = await User.findOne({ _id: userId });
  if (!user) return 0;

  let sales = 0;

  const referrals =
    (await referralCtlr.getAllReferrals(
      { referralId: userId, isActive: true },
      config.REFERRAL_DEPTH,
    )) || [];

  for (const referral of referrals) {
    const sumOfAmount = await userDepositlBalanceByQuery(
      referral._id,
      moreQuery,
    );
    sales += sumOfAmount;
  }

  return sales;
};

const firstDepositeDate = async (userid: string) => {
  const transaction = await Transaction.findOne({
    userId: userid,
    status: config.STATUS.APPROVED,
    transactionType: config.TRANSACTION_TYPES.DEPOSIT,
  });
  return transaction?.updatedAt;
};

const transactionCtlr = {
  get,
  getAddress,
  create,
  find,
  userSum,
  save,
  findOne,
  paginate,
  countDocuments,
  userDepositlBalanceByQuery,
  userProfitBalanceByQuery,
  userCreditBalanceByQuery,
  userEquityBalanceByQuery,
  userAccountBalanceByQuery,
  userRewardBalanceByQuery,
  getAllTrans,
  userSalesByQuery,
  firstDepositeDate,
};
export default transactionCtlr;
