const mongoose = require("mongoose");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Reward = require("../../models/rewardModel");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorHandler");
const sendEmail = require("../../utils/sendEmail");
const programCtlr = require("../programController");
const referralCtlr = require("../referralsController");
const userCtlr = require("../userController");
const rankCtlr = require("../ranksController");
const transactionCtlr = require("../transactionController");
const notificationService = require("../../services/notificationService");
const HELPER = require("../../helpers/index");
const { ObjectId } = require("mongodb");

const {
  STATUS,
  NOTIFICATION_TYPES,
  DEFAULT_FEE_AMOUNT,
} = require("../../config/constants");
const { date } = require("faker/lib/locales/az");

exports.get = catchAsyncErrors(async (req, res, next) => {

  const { status, criteria, searchQuery, page = 1 } = req.query;
  const pageSize = parseInt(process.env.RECORDS_PER_PAGE, 10) || 15;
  let query = {};

  if (status) query.status = status;

  let matchCriteria = {};

  if (criteria === 'claimedRewards') {
    matchCriteria.isClaimed = true;
  } else if (criteria === 'amount') {
    matchCriteria.sales = { $gte: parseFloat(searchQuery || 0) };
  } else if (criteria === 'date') {
    matchCriteria.date = { $gte: new Date(searchQuery || 0) };
  }

  const ranks = await Reward.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      },
    },
    {
      $unwind: "$user"
    },
    {
      $match: criteria === 'user' && searchQuery ? { 'user.username': { $regex: searchQuery, $options: 'i' } } : {}
    },
    {
      $lookup: {
        from: "ranks",
        localField: "rankId",
        foreignField: "_id",
        as: "rank"
      }
    },
    {
      $unwind: "$rank"
    },
    {
      $project: {
        rewardId: "$_id",
        id: "$user._id",
        name: "$user.username",
        directReferrals: "$directCount",
        indirectReferrals: "$indirectCount",
        reward: "$amount",
        sales: "$sales",
        status: "$status",
        rank: "$rank.title",
        date: "$updatedAt",
        isClaimed: "$isClaimed"
      }
    },
    {
      $match: matchCriteria
    },
    {
      $skip: (page - 1) * pageSize,
    },
    {
      $limit: pageSize,
    }
  ]);

  const totalCount = await Reward.countDocuments(query);

  res.json({
    success: true,
    ranks,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  });
});

exports.update = catchAsyncErrors(async (req, res, next) => {
  try {
    const { status, rewardId, reason } = req.body;
    const authId = req.user?.id;

    if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
      return next(new ErrorHandler("Invalid Reward Id", 400));
    }

    if (!status) {
      return next(new ErrorHandler("Status is required", 400));
    }

    // Find the reward to update
    const reward = await Reward.findOne({
      _id: rewardId,
      status: STATUS.PENDING,
    });

    if (!reward) {
      return next(new ErrorHandler(`No pending reward found`, 404));
    }

    const { userId, amount } = reward;

    if (status === STATUS.REJECTED) {
      if (!reason) {
        return next(new ErrorHandler(`Reason is required for rejected status`, 400));
      }
      await Reward.findByIdAndUpdate(rewardId, {
        status,
        reason,
        isClaimed: false,
        adminId: authId,
      });

      await notificationService.create({
        userId,
        type: NOTIFICATION_TYPES.ACTIVITY,
        message: `Your reward has been rejected for the following reason: ${reason}`,
      });

      return res.json({
        success: true,
        message: "Reward updated successfully",
      });
    }

    await Reward.findByIdAndUpdate(rewardId, {
      status,
      adminId: authId,
    });

    await User.findByIdAndUpdate(userId, { $inc: { rewardBalance: amount } });
    const message = `${amount} has been successfully rewarded.`;

    await notificationService.create({
      userId,
      type: NOTIFICATION_TYPES.ACTIVITY,
      message,
    });

    return res.json({
      success: true,
      message: "Reward updated successfully",
    });
  } catch (error) {
    return next(error);
  }
});

exports.countDocuments = async (query) => {
  return await Reward.countDocuments(query);
};

exports.find = async (query) => {
  return await Reward.find(query);
};

exports.findOne = async (query) => {
  return await Reward.findOne(query);
};
