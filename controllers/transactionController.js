const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const programCtlr = require("../controllers/programController");
const userCtlr = require("../controllers/userController");
const referralCtlr = require("./referralsController");
const rewardCtlr = require("./rewardsController");
const Reward = require("../models/rewardModel");
const Transaction = require("../models/transactionModel");
const notificationService = require("../services/notificationService");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const Trc20 = require("../utils/trc20Validator");
const HELPER = require("../helpers");

const {
  STATUS,
  TRANSACTION_TYPES,
  WITHDRAWAL_TYPES,
  MINIMUM_WITHDRAWAL_AMOUNT,
  NOTIFICATION_TYPES,
} = require("../config/constants");

const { ObjectId } = require("mongodb");
const { query } = require("express");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { id, role } = req?.user || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 30;

  const q = req?.query || {};
  const { page = 1, status, transactionType, from, to, search } = q || {};

  const query = {};
  if (search) {
    const regexSearchTerm = new RegExp(search, "i");
    query.uuid = { $regex: regexSearchTerm };
  }

  if (!role?.includes("admin")) {
    query.userId = new ObjectId(id);
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

  const data = await this.paginate(query, { page, pageSize });

  const total = (await this.countDocuments(query)) ?? 0;

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
});

exports.create = catchAsyncErrors(async (req, res, next) => {
  const {
    amount,
    receiverAddress,
    senderAddress,
    transactionType,
    withdrawalType,
  } = req.body || {};

  const { kyc, id } = req?.user || {};

  if (!TRANSACTION_TYPES[transactionType]) {
    return next(
      new ErrorHandler(
        "The transaction type does not seem to be recognised by our system.",
        400
      )
    );
  }

  if (!Trc20.isValidAddress(receiverAddress)) {
    return next(
      new ErrorHandler("Receiver address is invalid. Please try again.", 400)
    );
  }

  if (!Trc20.isValidAddress(senderAddress)) {
    return next(
      new ErrorHandler("Sender address is invalid. Please try again.", 400)
    );
  }

  const payload = {
    amount,
    userId: id,
    receiverAddress,
    senderAddress,
    transactionType,
    withdrawalType,
    uuid: null,
  };

  switch (transactionType) {
    case TRANSACTION_TYPES.WITHDRAWAL:
      if (!kyc || !kyc?.status) {
        return next(
          new ErrorHandler(
            "Kindly complete your KYC verification prior to initiating the withdrawal process.",
            400
          )
        );
      }

      if (amount <= MINIMUM_WITHDRAWAL_AMOUNT) {
        return next(
          new ErrorHandler(
            `The withdrawal amount must be a minimum of $${MINIMUM_WITHDRAWAL_AMOUNT}.`,
            400
          )
        );
      }

      if ([STATUS.REJECTED].includes(kyc?.status)) {
        return next(
          new ErrorHandler(
            `Your KYC verification did not meet our requirements. Please review and re-submit.`,
            400
          )
        );
      }

      if ([STATUS.PENDING].includes(kyc?.status)) {
        return next(
          new ErrorHandler(
            `Your KYC verification is currently under review. We will notify you once it's completed.`,
            400
          )
        );
      }

      if (!WITHDRAWAL_TYPES[withdrawalType]) {
        return next(
          new ErrorHandler(
            "The withdrawal type does not seem to be recognised by our system.",
            400
          )
        );
      }

      /* const currentDay = new Date().getDay();
      if (![0, 6].includes(currentDay)) {
        return next(
          new ErrorHandler(
            "Withdrawal requests can be made during the weekends, specifically on Saturdays and Sundays.",
            400
          )
        );
      }
       */
      const { key, balance } = await userCtlr.balanceByType({
        userId: id,
        withdrawalType,
      });

      if (amount > balance) {
        return next(
          new ErrorHandler(
            `You have insufficient balance in your account.`,
            400
          )
        );
      }

      const finalAmount = balance - amount;

      await User.findByIdAndUpdate(id, { $set: { [key]: finalAmount } });
      break;
    case TRANSACTION_TYPES.DEPOSIT:
      const program = await programCtlr.findOne(
        { "data.investment": Number(amount) },
        { "data.investment": 1, _id: 0 }
      );

      if (!program) {
        return next(
          new ErrorHandler("Invalid investment amount. Please try again.", 400)
        );
      }
      break;
  }

  const transaction = await this.save(payload);

  await notificationService.create({
    userId: id,
    type: NOTIFICATION_TYPES.ACTIVITY,
    message: `${transaction?.transactionType
      ?.toLowerCase()
      ?.capitalizeFirst()} of amount $${amount} is now in ${transaction?.status?.toLowerCase()} state. The transaction status will be updated within 3 working days. ${
      transaction?.uuid
    }`,
  });

  res.json({
    success: true,
    message: "Transaction created successfully",
  });
});

exports.find = async (query) => {
  return Transaction.find(query);
};

exports.userSum = async (query, key) => {
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

exports.save = async (payload) => {
  const transaction = new Transaction(payload);
  return await transaction.save();
};

exports.findOne = async (query) => {
  return await Transaction.findOne(query);
};

exports.paginate = async (query, options) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

exports.countDocuments = async (query) => {
  return await Transaction.countDocuments(query);
};

exports.userDepositlBalanceByQuery = async (userId, query = {}) => {
  if (!userId) return 0;

  const depositQuery = {
    userId: new ObjectId(userId),
    status: {
      $in: [STATUS.APPROVED],
    },
    transactionType: {
      $in: [TRANSACTION_TYPES.DEPOSIT],
    },
    ...query,
  };

  const depositResult = (await this.userSum(depositQuery, "$amount")) ?? 0;

  const withdrawalQuery = {
    userId: new ObjectId(userId),
    status: {
      $in: [STATUS.APPROVED, STATUS.PENDING],
    },
    transactionType: {
      $in: [TRANSACTION_TYPES.WITHDRAWAL],
    },
    withdrawalType: {
      $in: [WITHDRAWAL_TYPES.DEPOSIT],
    },
    ...query,
  };
  const withdrawResult =
    (await this.userSum(withdrawalQuery, "$originalAmount")) ?? 0;
  return depositResult - withdrawResult;
};

exports.userProfitBalanceByQuery = async (userId, query = {}) => {
  if (!userId) return 0;

  const profitQuery = {
    userId: new ObjectId(userId),
    status: {
      $in: [STATUS.APPROVED],
    },
    transactionType: {
      $in: [TRANSACTION_TYPES.PROFIT],
    },
    ...query,
  };

  const withdrawalQuery = {
    userId: new ObjectId(userId),
    status: {
      $in: [STATUS.APPROVED, STATUS.PENDING],
    },
    transactionType: {
      $in: [TRANSACTION_TYPES.PROFIT],
    },
    withdrawalType: {
      $in: [WITHDRAWAL_TYPES.PROFIT],
    },
    ...query,
  };

  const profitResult = (await this.userSum(profitQuery, "$amount")) ?? 0;

  const withdrawResult =
    (await this.userSum(withdrawalQuery, "$originalAmount")) ?? 0;

  return profitResult - withdrawResult;
};

exports.userCreditBalanceByQuery = async (userId, moreQuery = {}) => {
  if (!userId) return 0;

  const user = await User.findOne({ _id: userId });

  if (!user) return 0;

  //get program of this user with his investmentLevel get creditPercentage
  const program = await programCtlr.findOne({
    level: user?.investmentLevel,
  });

  let creditBalance = 0;

  //get all referrals of this user
  const referrals =
    (await referralCtlr.getAllReferrals(
      { referralId: userId, isActive: true },
      8
    )) || [];
  //check every referral
  for (const referral of referrals) {
    const query = {
      userId: referral._id,
      status: STATUS.APPROVED,
      ...moreQuery,
    };
    //get all transaction of each referral
    const transactions = await this.find(query);

    if (!transactions?.length) continue;

    //sum of all transactions amount
    const sumOfAmount = transactions?.reduce((total, { amount }) => {
      return total + amount;
    }, 0);

    const subProgram = program?.data?.find((row) => {
      if (referral?.sublevel == row?.level) {
        //need to add more checks
        return row;
      }
    });
    if (!subProgram) continue;

    console.log(sumOfAmount, subProgram?.creditPercentage);
    //calc the balance and plus to this user's credit
    const appliedPercentage = HELPER.applyPercentage(
      sumOfAmount,
      Number(subProgram?.creditPercentage)
    );
    creditBalance += appliedPercentage;
  }

  return creditBalance;
};

exports.userEquityBalanceByQuery = async (userid, query = {}) => {
  return (
    (await this.userCreditBalanceByQuery(userid, query)) +
    (await this.userDepositlBalanceByQuery(userid, query))
  );
};

exports.userAccountBalanceByQuery = async (userid, query = {}) => {
  return (
    (await this.userProfitBalanceByQuery(userid, query)) +
    (await this.userDepositlBalanceByQuery(userid, query))
  );
};

exports.userRewardBalanceByQuery = async (userid, query = {}) => {
  const rewardQuery = {
    userId: userid,
    status: {
      $in: [STATUS.APPROVED, STATUS.PENDING],
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
        sumOfKey: { $sum: "$amount" },
      },
    },
  ]);
  if (result.length > 0) return result[0].sumOfKey;
  return 0;
};
