const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const programCtlr = require("../controllers/programController");
const userCtlr = require("../controllers/userController");
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

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { id, role } = req?.user || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

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

exports.countDocuments = async (query) => {
  return await Transaction.countDocuments(query);
};

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

exports.userProfitBalance = async (userId) => {
  const profitQuery = {
    userId: new ObjectId(userId),
    status: {
      $in: [STATUS.APPROVED],
    },
    transactionType: {
      $in: [TRANSACTION_TYPES.PROFIT],
    },
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
  };

  const profitResult = (await this.userSum(profitQuery, "$amount")) ?? 0;
  const withdrawResult =
    (await this.userSum(withdrawalQuery, "$originalAmount")) ?? 0;

  return profitResult - withdrawResult;
};

exports.userDepositBalance = async (userId) => {
  const depositQuery = {
    userId: new ObjectId(userId),
    status: {
      $in: [STATUS.APPROVED],
    },
    transactionType: {
      $in: [TRANSACTION_TYPES.DEPOSIT],
    },
  };

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
  };

  const depositResult = (await this.userSum(depositQuery, "$amount")) ?? 0;
  const withdrawResult =
    (await this.userSum(withdrawalQuery, "$originalAmount")) ?? 0;

  return depositResult - withdrawResult;
};

exports.find = async (query) => {
  return Transaction.find(query);
};

exports.userSum = async (query, key) => {
  const [{ sumOfKey }] = await Transaction.aggregate([
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

  return sumOfKey;
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
