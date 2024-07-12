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
  const sales = this.userSalesByQuery(userId, moreQuery);

  //get program of this user with his investmentLevel get creditPercentage
  const program = await programCtlr.findOne({
    level: user?.investmentLevel,
  });
  const subProgram = program?.data?.find((row) => {
    if (referral?.sublevel == row?.level) {
      //need to add more checks
      return row;
    }
  });
  if (!subProgram) return 0;
  //calc the balance and plus to this user's credit
  const appliedPercentage = HELPER.applyPercentage(
    sales,
    Number(subProgram?.creditPercentage)
  );

  return appliedPercentage;
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

// getting data for sales analystic chart
exports.getAllTrans = async (req, res) => {
  // console.log("+++++++++++",req.params.key);
  const { id } = req.user;
  const userId = new ObjectId(id);
  const query = {
    referralId: userId,
    isActive: true,
  };
  const referrals = (await referralCtlr.getAllReferrals(query, 8)) || [];
  let transactions = [];
  for (const referral of referrals) {
    const depositQuery = {
      status: STATUS.APPROVED,
      userId: referral?._id,
    };

    const result = await Transaction.find(depositQuery);
    if (result.toString().length != 0) {
      transactions.push(result);
    }
  }

  if (req.params.key == "month") {
    const monthlyData = {};
    transactions.forEach((item) => {
      const date = new Date(item[0].createdAt);
      console.log("date --", item[0].createdAt, "-- amount -", item[0].amount);
      const formattedDate = `${padZero(date.getMonth() + 1)}`;
      if (!monthlyData[formattedDate]) {
        monthlyData[formattedDate] = 0;
      }
      monthlyData[formattedDate] += item[0].amount;
    });
    const arr = Object.entries(monthlyData).map(([key, value]) => [key, value]);
    const monthResult = Array(12).fill(0);
    for (let i = 0; i < 12; i++) {
      arr.map((arrItem) => {
        let itemMonth = Number(arrItem[0].toString());
        if (i == itemMonth - 1) {
          monthResult[i] = arrItem[1];
        }
      });
    }
    return res.json({ monthResult });
  } else {
    const dailyData = {};

    transactions.forEach((item) => {
      const date = new Date(item[0].createdAt);
      const formattedDate = `${padZero(date.getDate())}`;
      if (!dailyData[formattedDate]) {
        dailyData[formattedDate] = 0;
      }
      dailyData[formattedDate] += item[0].amount;
    });

    const dailyDataArray = Object.entries(dailyData).map(([key, value]) => ({
      [key]: value,
    }));
    const convertdailydate = dailyDataArray.map((str) => {
      let temp = JSON.stringify(str);
      temp = temp.slice(1, temp.length - 1);
      let day = temp.split(":")[0];
      day = day.slice(1, day.length - 1);
      const amount = temp.split(":")[1];
      return [Number(day), Number(amount)];
    });

    let currentDate = new Date();
    let monthNumber = currentDate.getMonth();
    let months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let initialArrayDay = new Array(months[monthNumber]).fill(0);
    let index = 0;
    for (index; index < initialArrayDay.length; index++) {
      convertdailydate.map((item, key) => {
        if (index == item[0]) {
          initialArrayDay[index] = item[1];
        }
      });
    }

    if (req.params.key == "day") {
      return res.json({ initialArrayDay });
    } else if (req.params.key == "week") {
      let flag = 0;
      let weekResult = [];
      let temp = 0;
      console.log(initialArrayDay);
      initialArrayDay.map((item) => {
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

const padZero = (num) => {
  return num.toString().padStart(2, "0");
};

/**
 *
 * @param {ObjectId} userId  for which you want to get sales volume
 * @param {object} moreQuery more info to get sales
 * @returns {Number} sales volume of user
 */
exports.userSalesByQuery = async (userId, moreQuery = {}) => {
  if (!userId) return 0;

  const user = await User.findOne({ _id: userId });

  if (!user) return 0;

  let sales = 0;

  //get all referrals of this user
  const referrals =
    (await referralCtlr.getAllReferrals(
      { referralId: userId, isActive: true },
      8
    )) || [];

  //check every referral
  for (const referral of referrals) {
    //sum of all transactions amount
    const sumOfAmount = await this.userDepositlBalanceByQuery(
      referral._id,
      moreQuery
    );

    sales += sumOfAmount;
  }
  return sales;
};

exports.firstDepositeDate = async (userid) => {
  const transaction = await Transaction.findOne({
    userId: userid,
    status: STATUS.APPROVED,
    transactionType: TRANSACTION_TYPES.DEPOSIT,
  });
  return transaction?.updatedAt;
};
