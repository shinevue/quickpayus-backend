const mongoose = require("mongoose");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Transaction = require("../../models/transactionModel");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorHandler");
const sendEmail = require("../../utils/sendEmail");
const programCtlr = require("../programController");
const referralCtlr = require("../referralsController");
const userCtlr = require("../userController");
const notificationService = require("../../services/notificationService");
const HELPER = require("../../helpers/index");
const { ObjectId } = require("mongodb");

const {
  STATUS,
  TRANSACTION_TYPES,
  WITHDRAWAL_TYPES,
  NOTIFICATION_TYPES,
  DEFAULT_FEE_AMOUNT,
} = require("../../config/constants");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { type, page = 1 } = req?.query || {};
  const pageSize = process.env.RECORDS_PER_PAGE || 15;
  let query = {};
  if (type) {
    query.status = type;
  }

  const deposites = await this.find(query)
    .populate("userId")
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const totalDeposites = await this.countDocuments(query);

  res.json({
    success: true,
    deposites,
    totalDeposites,
    totalPages: Math.ceil(totalDeposites / pageSize),
  });
});

exports.update = catchAsyncErrors(async (req, res, next) => {
  const { status, transactionId, reason } = req?.body || {};
  const authId = req?.user?.id;

  if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new ErrorHandler("Transaction Id is invalid", 400);
  }

  if (!status) {
    throw new ErrorHandler("Please provide status", 400);
  }

  // Find the transaction to update
  const transaction = await this.findOne({
    _id: transactionId,
    status: STATUS.PENDING,
  });

  if (!transaction) {
    throw new ErrorHandler(
      `No ${STATUS.PENDING.toLowerCase()} transaction not found`,
      404
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
  } = transaction || {};

  if (status?.includes(STATUS.REJECTED)) {
    if (!reason) {
      return next(
        new ErrorHandler(
          `The reason must be provided for ${STATUS.REJECTED} case!`
        )
      );
    }
    await Transaction.findByIdAndUpdate(transactionId, {
      status,
      reason,
      adminId: authId,
    });

    if (transactionType?.includes(TRANSACTION_TYPES.WITHDRAWAL)) {
      const { key, balance } = await userCtlr.balanceByType({
        userId,
        withdrawalType,
      });

      await User.findByIdAndUpdate(userId, {
        $set: { [key]: balance + originalAmount },
      });
    }

    let message = `Unfortunately, your ${transactionType?.toLowerCase()} of $${originalAmount} has been ${status?.toLowerCase()}. If you have any questions, please contact support. ${uuid}`;

    notificationService.create({
      userId,
      type: NOTIFICATION_TYPES.ACTIVITY,
      message,
    });

    return res.json({
      success: true,
      message: "Transaction updated successfully",
    });
  }

  await Transaction.findByIdAndUpdate(transactionId, {
    status,
    adminId: authId,
  });

  let keyToUpdate = null,
    balance = 0,
    program;
  const userUpdate = {};

  let message = `The ${transactionType?.toLowerCase()} of $${originalAmount} has been successfully processed and ${status?.toLowerCase()}. Please note, a ${DEFAULT_FEE_AMOUNT}% fee has been deducted, resulting in a net amount of $${amount}. ${uuid}`;

  if (transactionType?.includes(TRANSACTION_TYPES.DEPOSIT)) {
    const balanceResponse = await userCtlr.balanceByType({
      userId,
      transactionType,
    });

    keyToUpdate = balanceResponse?.key;
    balance = amount + balanceResponse?.balance;

    userUpdate.$set = {
      [keyToUpdate]: balance,
    };

    program = await programCtlr.findByInvestment(
      originalAmount + balanceResponse?.balance
    );

    userUpdate.investmentLevel = program?.level || null;
    userUpdate.investmentSubLevel = program?.data?.level || null;
  } else if (transactionType?.includes(TRANSACTION_TYPES.WITHDRAWAL)) {
    const balanceResponse = await userCtlr.balanceByType({
      userId,
      withdrawalType,
    });
    //keyToUpdate = balanceResponse?.key;
    balance = balanceResponse?.balance;

    message = `Your ${transactionType?.toLowerCase()} of $${originalAmount} has been ${status?.toLowerCase()}. Please note, a ${DEFAULT_FEE_AMOUNT}% fee has been deducted. ${uuid}`;

    switch (withdrawalType) {
      case WITHDRAWAL_TYPES.DEPOSIT:
        program = await programCtlr.findByInvestment(balance);
        userUpdate.investmentLevel = program?.level || null;
        userUpdate.investmentSubLevel = program?.data?.level || null;
        await this.updateCreditToParents(user, transactionType, balance);
        break;
    }
  }

  const user = await User.findByIdAndUpdate(userId, userUpdate);

  if (transactionType?.includes(TRANSACTION_TYPES.DEPOSIT)) {
    await this.updateCreditToParents(user, transactionType, balance);
  }

  notificationService.create({
    userId,
    type: NOTIFICATION_TYPES.ACTIVITY,
    message,
  });

  // await sendEmail({
  //   email: user?.email,
  //   subject: `${transaction?.transactionType} has been ${status}.`,
  //   message: description,
  // });

  return res.json({
    success: true,
    message: "Transaction updated successfully",
  });
});

exports.updateCreditToParents = async (user, type, amount) => {
  const parentReferralsQuery = {
    _id: new ObjectId(user?._id),
    isActive: true,
  };

  const parentReferrers = await referralCtlr.parentReferrers(
    parentReferralsQuery
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

    const appliedCreditPercentage = HELPER.applyPercentage(
      amount,
      program?.data?.creditPercentage
    );

    const userUpdate = {
      $set: {
        referralCreditBalance:
          parent?.referralCreditBalance + appliedCreditPercentage ?? 0,
      },
    };

    const parentId = new ObjectId(parent?._id);

    await User.findByIdAndUpdate(parentId, userUpdate);

    await notificationService.create({
      userId: parentId,
      type: NOTIFICATION_TYPES.ACTIVITY,
      message: `Congratulations! You've successfully earned a credit of $${appliedCreditPercentage} through your referral from: ${user?.username}. This credit has been added to your account.`,
    });
  }
};

exports.countDocuments = async (query) => {
  return await Transaction.countDocuments(query);
};

exports.find = async (query) => {
  return await Transaction.find(query);
};

exports.findOne = async (query) => {
  return await Transaction.findOne(query);
};
exports.totalSumByKey = async (key) => {
  const response = await Transaction.aggregate([
    {
      $match: {
        status: STATUS.APPROVED,
        transactionType: {
          $in: [TRANSACTION_TYPES.DEPOSIT, TRANSACTION_TYPES.WITHDRAWAL],
        },
      },
    },
    {
      $group: {
        _id: null, // Grouping without specifying a field will aggregate over the whole dataset
        sumOfKey: { $sum: key },
      },
    },
  ]);
  return response?.length ? response[0]?.sumOfKey : 0;
};
