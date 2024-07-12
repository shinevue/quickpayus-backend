const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const Reward = require("../models/rewardModel");
const { STATUS } = require("../config/constants");
const Rank = require("../models/rankModel");
const RankCtrl = require("../controllers/ranksController");
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
  const lastReward = await Reward.findOne().sort({ _id: -1 });

  if (lastReward && lastReward.status == STATUS.PENDING) {
    next(new ErrorHandler("Alearyd Claimed", 400));
  }
  const userId = new ObjectId(req.user.id);
  const rankInfo = await RankCtrl.getUserRankInfo(userId);

  if (rankInfo) {
    const result = await this.create(userId, rankInfo, true);
    if (result) {
      res.json({
        success: true,
      });
    }
  }
  res.json({
    success: false,
  });
});

exports.create = async (userId, rankInfo, isClaimed) => {
  if (!rankInfo.rank) return;
  const rankId = rankInfo.rank._id;
  const amount = rankInfo.amount;

  const reward = new Reward({
    userId,
    rankId,
    amount,
    isClaimed,
  });

  return await reward.save();
};
