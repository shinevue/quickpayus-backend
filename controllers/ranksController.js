const Reward = require("../models/rewardModel");
const Rank = require("../models/rankModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const referralCtlr = require("./referralsController");
const { ObjectId } = require("mongodb");
const depositCtlr = require("./transactionController");
const { minusDaysFromDate, checkRankPeriod } = require("../helpers");
const { STATUS } = require("../config/constants");
const rewardCtlr = require("../controllers/rewardsController");
const moment = require("moment");

exports.rank = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.user || {};

  const result = await this.getUserRankInfo(id);
  if (result) {
    if (checkRankPeriod(result.joiningDate)) {
      await rewardCtlr.create(id, result, false);
    }
  }
  res.send({
    success: "true",
    data: result,
  });
});

exports.findOne = async (query) => {
  return await Rank.findOne(query);
};

exports.find = async (query) => {
  return await Rank.find(query);
};

exports.getUserRankInfo = async (id) => {
  const userId = new ObjectId(id);

  // joining day of this period

  const lastPeriodReward = await Reward.findOne({
    userId,
    isClaimed: false,
  })
    .sort({
      _id: -1,
    })
    .limit(1);

  let joiningDate; //start of this rank's period
  if (lastPeriodReward) {
    joiningDate = new Date(lastPeriodReward?.createdAt);
  } else {
    const referrals =
      (await referralCtlr.getAllReferrals(
        {
          referralId: userId,
          isActive: true,
        },
        8
      )) || [];

    for (const referral of referrals) {
      const firstDepositDate = await depositCtlr.firstDepositeDate(
        referral._id
      );
      if (!joiningDate) joiningDate = firstDepositDate;
      else if (moment(joiningDate).isAfter(firstDepositDate)) {
        joiningDate = firstDepositDate;
      }
    }
  }
  if (!joiningDate) return {};

  //start day of rank
  const lastReward = await Reward.findOne({
    userId: userId,
  })
    .sort({
      updatedAt: -1,
    })
    .limit(1);
  const startdate = new Date(lastReward?.createdAt || joiningDate);

  //Count of direct referrals
  const query = {
    referralId: userId,
    createdAt: {
      $gte: startdate,
    },
  };
  let counts = await referralCtlr.directReferralsCount(query);
  if (!lastReward) counts += 1;

  let inDirectCounts = await referralCtlr.indirectReferralsCount(query, 8);
  //total sales of user in this period
  const depositQuery = {
    updatedAt: {
      $gte: startdate,
    },
  };

  const sales = await depositCtlr.userSalesByQuery(userId, depositQuery);

  //rank of this user
  const rankQuery = {
    directReferralsRequired: {
      $lte: counts,
    },
    requiredSalesFrom: {
      $lte: sales,
    },
  };

  const rank = await Rank.findOne(rankQuery).sort({ _id: -1 });

  return {
    joiningDate: new Date(startdate),
    directReferralsCount: counts,
    indirectReferralsCount: inDirectCounts,
    sumOfLast30DaysSales: sales,
    rank: rank ? rank.toObject() : {},
  };
};
