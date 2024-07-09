const Reward = require("../models/rewardModel");
const Rank = require("../models/rankModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const referralCtlr = require("./referralsController");
const { ObjectId } = require("mongodb");
const depositCtlr = require("./transactionController");
const { minusDaysFromDate } = require("../helpers");
const { STATUS } = require("../config/constants");

exports.rank = catchAsyncErrors(async (req, res, next) => {
  const { id, createdAt } = req?.user || {};
  const userId = new ObjectId(id),
    thirtyDaysAgo = minusDaysFromDate(30);

  let sumOfLast30DaysSales = 0;
  const query = { referralId: userId, isActive: true };

  const approvedReward = await Reward.findOne({
    userId: id,
    status: STATUS.APPROVED,
  })
    .sort({
      approvedAt: -1,
    })
    .limit(1)
    .exec();
  const directReferralsCount = await referralCtlr.directReferralsCount(query);
  // all referrals with transactions for last 30 days;
  const referrals = (await referralCtlr.getAllReferrals(query, 8)) || [];
  let useApprovedAt = false;

  if (approvedReward?.approvedAt) useApprovedAt = true;

  for (const referral of referrals) {
    const depositQuery = {
      status: STATUS.APPROVED,
      userId: referral?._id,
      createdAt: {
        $gte: useApprovedAt ? approvedReward?.approvedAt : thirtyDaysAgo,
      },
    };

    const transactions = await depositCtlr.find(depositQuery);
    if (!transactions?.length) continue;

    sumOfLast30DaysSales += transactions?.reduce((total, { amount }) => {
      return total + amount;
    }, 0);
  }
  
  const rankQuery = {
    directReferralsRequired: {
      $lte: directReferralsCount,
    },
    requiredSalesFrom: {
      $lte: sumOfLast30DaysSales,
    },
    requiredSalesTo: {
      $gte: sumOfLast30DaysSales,
    },
  };

  if (approvedReward) {
    rankQuery._id = {
      $ne: approvedReward?.rankId,
    };
  }
  const rank = await Rank.findOne(rankQuery);
  return res.json({
    success: true,
    data: {
      joiningDate: createdAt,
      directReferralsCount,
      sumOfLast30DaysSales,
      rank,
    },
  });
});

exports.findOne = async (query) => {
  return await Rank.findOne(query);
};

exports.find = async (query) => {
  return await Rank.find(query);
};

exports.getUserRank = async (req, res, next) => {
  const query = { ...req?.body };
  const rank = await this.findOne(query);
  if (!rank) {
    return next(new ErrorHandler("No rank found"));
  }
  return res.json({
    success: true,
    data: rank,
  });
};
