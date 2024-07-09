const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Reward = require("../models/rewardModel");
const { STATUS } = require("../config/constants");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { type, page = 1 } = req?.query || {};
  const userId = req.user.id;
  const pageSize = process.env.RECORDS_PER_PAGE || 15;
  const query = {};
  if (type) {
    query.status = type;
  }

  const data = await Reward.find({ userId })
    .populate("userId")
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const total = await Reward.countDocuments(query);

  res.json({
    success: true,
    data,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

exports.claimReward = catchAsyncErrors(async (req, res, next) => {
  const userId = req?.user?.id;
  const { rankId } = req?.body || {},
    status = STATUS.PENDING;

  const reward = await Reward.findOne({ userId, rankId, status });

  if (reward) {
    return next(
      new ErrorHandler(`Claimed reward is already in ${status} status!`)
    );
  } else {
    const newReward = new Reward({
      userId,
      rankId,
    });

    await newReward.save();
  }

  return res.json({
    success: true,
  });
});
