const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ranksCtlr = require("../ranksController");
const {
  STATUS,
  TRANSACTION_TYPES,
  NOTIFICATION_TYPES,
} = require("../../config/constants");
const Reward = require("../../models/rewardModel");
const User = require("../../models/userModel");
const Transaction = require("../../models/transactionModel");
const notificationService = require("../../services/notificationService");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const data = await ranksCtlr.find({});

  if (!data?.length) {
    return res.json({
      success: false,
      data: [],
    });
  }

  return res.json({
    success: true,
    data,
  });
});

exports.update = catchAsyncErrors(async (req, res, next) => {
  const { rewardId, status } = req.body;

  //Update Reward
  const reward = await Reward.findById(rewardId);
  if (!reward) {
    next(ErrorHandler("Not found Reward", 204));
  }
  if (reward.status !== STATUS.PENDING) {
    next(ErrorHandler("Already confirmed", 204));
  }
  reward.status = STATUS.APPROVED;
  await reward.save();

  //Update User
  const user = await User.findById(reward.userId);
  if (!user) {
    next(ErrorHandler("Not found User", 204));
  }
  user.rewardBalance += reward.amount || 0;
  await user.save();

  //Add transaction
  const transaction = new Transaction({
    userId: user._id,
    adminId: req.user.id,
    amount: reward.amount,
    transactionType: TRANSACTION_TYPES.REWARD,
    status: STATUS.APPROVED,
  });
  await transaction.save();

  await notificationService.create({
    userId: user._id,
    type: NOTIFICATION_TYPES.ACTIVITY,
    message: `${TRANSACTION_TYPES.REWARD.toLowerCase()?.capitalizeFirst()} of amount $${
      reward.amount
    } has been deposited in your account.`,
  });

  res.status(200).send({
    success: true,
    message: "Successfully updated.",
  });
});
