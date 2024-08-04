const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Reward = require("../models/rewardModel");
const { STATUS, NOTIFICATION_TYPES } = require("../config/constants");
const User = require("../models/userModel");
const RankCtrl = require("../controllers/ranksController");
const notificationService = require("../services/notificationService")
const { ObjectId } = require("mongodb");
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
  const userId = new ObjectId(req.user.id);

  const rankInfo = await RankCtrl.getUserRankInfo(userId);

  if (!Object.keys(rankInfo).length) {
    return next(new ErrorHandler("The rank period has not started.", 400));
  }

  if (!rankInfo.rank.hasOwnProperty("_id")) {
    return next(new ErrorHandler("The rank level has not been reached.", 400));
  }
  const result = await this.create(userId, rankInfo, true);
  if (result) {
    res.status(200).json({
      success: true,
      data: {
        ...result._doc,
        title: rankInfo.rank.title,
      },
    });
  } else next(new ErrorHandler("Server error(claim)", 500));
});

exports.create = async (userId, rankInfo, isClaimed) => {
  try {
    if (rankInfo.rank && Object.keys(rankInfo.rank).length) {
      const rankId = rankInfo.rank._id;

      const { rewardFrom, rewardTo, requiredSalesFrom, requiredSalesTo } =
        rankInfo.rank;

      //calc reward
      const amount = rewardAmount(
        rewardFrom,
        rewardTo,
        requiredSalesFrom,
        requiredSalesTo,
        rankInfo.sumOfLast30DaysSales
      );

      if (amount) {
        //update user reward balance

        await User.findByIdAndUpdate(userId, { $inc: { rewardBalance: amount } });
        const message = `${amount} has been successfully rewarded.`;

        //create notification
        await notificationService.create({
          userId,
          title: "~Reward~",
          type: NOTIFICATION_TYPES.ACTIVITY,
          message,
        });

      }

      //create reward
      const reward = new Reward({
        userId,
        rankId,
        amount,
        isClaimed,
        sales: rankInfo.sumOfLast30DaysSales,
        directCount: rankInfo.directReferralsCount,
        indirectCount: rankInfo.indirectReferralsCount,
      });
      return await reward.save();
    } else {
      const reward = new Reward({
        userId,
        isClaimed,
      });
      return await reward.save();
    }
  } catch (error) {
    throw error;
  }
};

function rewardAmount(rewardMin, rewardMax, requireMin, requireMax, sales) {
  if (requireMax <= sales) return rewardMax;
  if (requireMin > sales) return 0;
  return (
    ((rewardMax - rewardMin) * (sales - requireMin)) /
    (requireMax - requireMin) +
    rewardMin
  );
}
