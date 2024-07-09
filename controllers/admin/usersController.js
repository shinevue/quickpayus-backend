const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Reward = require("../../models/rewardModel");
const Rank = require("../../models/rankModel");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorHandler");
const sendEmail = require("../../utils/sendEmail");
const { ObjectId } = require("mongodb");

const {
  STATUS,
  TRANSACTION_TYPES,
  WITHDRAWAL_TYPES,
  NOTIFICATION_TYPES,
} = require("../../config/constants");
const notificationService = require("../../services/notificationService");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { type, kycStatus, page = 1, kyc = false, search } = req?.query || {};
  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const query = {};
  if (search) {
    const regexSearchTerm = new RegExp(search, "i");
    query.$or = [
      { firstName: { $regex: regexSearchTerm } },
      { lastName: { $regex: regexSearchTerm } },
      { username: { $regex: regexSearchTerm } },
      { email: { $regex: regexSearchTerm } },
    ];
  }
  if (kyc) {
    if (kycStatus) {
      query["kyc.status"] = kycStatus;
    } else {
      query.kyc = { $exists: true };
    }
  }
  if (type === "Active" || type === "inActive") {
    query.isActive = type === "Active";
  }

  const data = await User.find(query)
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  //const data = await this.getUsersWithBalance(page, pageSize, query);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
});

/* exports.getUsersWithBalance = async (page, pageSize, query) => {
  try {
    console.log(TRANSACTION_TYPES.DEPOSIT, STATUS.APPROVED);
    const usersTotalBalance = await User.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "transactions",
          localField: "_id",
          foreignField: "userId",
          as: "transactions",
        },
      },
      {
        $addFields: {
          depositSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "transaction",
                    cond: {
                      $and: [
                        { $eq: ["$$transaction.status", STATUS.APPROVED] },
                        {
                          $eq: [
                            "$$transaction.transactionType",
                            TRANSACTION_TYPES.DEPOSIT,
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "transaction",
                in: "$$transaction.amount",
              },
            },
          },

          pendingDepositSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "transaction",
                    cond: {
                      $and: [
                        { $eq: ["$$transaction.status", STATUS.PENDING] },
                        {
                          $eq: [
                            "$$transaction.transactionType",
                            TRANSACTION_TYPES.DEPOSIT,
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "transaction",
                in: "$$transaction.amount",
              },
            },
          },

          withdrawalSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "transaction",
                    cond: {
                      $and: [
                        { $eq: ["$$transaction.status", STATUS.APPROVED] },
                        {
                          $eq: [
                            "$$transaction.transactionType",
                            TRANSACTION_TYPES.WITHDRAWAL,
                          ],
                        },
                        {
                          $eq: [
                            "$$transaction.withdrawalType",
                            WITHDRAWAL_TYPES.DEPOSIT,
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "transaction",
                in: "$$transaction.originalAmount",
              },
            },
          },

          pendingWithdrawalSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "transaction",
                    cond: {
                      $and: [
                        { $ne: ["$$transaction.status", STATUS.APPROVED] },
                        {
                          $eq: [
                            "$$transaction.transactionType",
                            TRANSACTION_TYPES.WITHDRAWAL,
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "transaction",
                in: "$$transaction.originalAmount",
              },
            },
          },

          profitSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "transaction",
                    cond: {
                      $and: [
                        { $eq: ["$$transaction.status", STATUS.APPROVED] },
                        {
                          $eq: [
                            "$$transaction.transactionType",
                            TRANSACTION_TYPES.PROFIT,
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "transaction",
                in: "$$transaction.originalAmount",
              },
            },
          },

          withdrawalProfitSum: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$transactions",
                    as: "transaction",
                    cond: {
                      $and: [
                        { $eq: ["$$transaction.status", STATUS.APPROVED] },
                        {
                          $eq: [
                            "$$transaction.transactionType",
                            TRANSACTION_TYPES.WITHDRAWAL,
                          ],
                        },
                        {
                          $eq: [
                            "$$transaction.withdrawalType",
                            WITHDRAWAL_TYPES.PROFIT,
                          ],
                        },
                      ],
                    },
                  },
                },
                as: "transaction",
                in: "$$transaction.originalAmount",
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          isActive: 1,
          firstName: 1,
          lastName: 1,
          pendingDeposit: 1,
          pendingWithdrawal: 1,
          totalBalance: { $subtract: ["$depositSum", "$withdrawalSum"] },
          totalProfitBalance: {
            $subtract: ["$profitSum", "$withdrawalProfitSum"],
          },
          kyc: 1,
        },
      },
      {
        $skip: (page - 1) * pageSize,
      },
      {
        $limit: Number(pageSize),
      },
    ]);

    return usersTotalBalance;
  } catch (error) {
    console.error(error);
  }
}; */

exports.getUser = catchAsyncErrors(async (req, res, next) => {
  const id = req.params.id;
  const data = await User.findById(id);
  res.json({
    success: true,
    data,
  });
});

exports.updateKyc = catchAsyncErrors(async (req, res, next) => {
  const { status, reason, uuid } = req.body || {};
  const adminId = req.user.id;

  const userUpdate = {
    $set: {
      "kyc.status": status,
      "kyc.reason": reason,
      "kyc.adminId": adminId,
    },
  };

  const user = await User.findOneAndUpdate({ uuid }, userUpdate, { new: true });
  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }
  // Send email notification
  /* await sendEmail({
    email: user.email,
    subject: `Approved KYC verification: “Congratulations! Your KYC verification has been successfully approved. You may now proceed with your withdrawal.
 ${user?.kyc?.status}`,
    message: description,
  }); */

  let notificationMsg = "";

  if (status?.includes(STATUS.APPROVED)) {
    notificationMsg = `Approved KYC Verification: "Congratulations! Your KYC verification has been successfully approved. You may now proceed with your withdrawal.`;
  } else if (status?.includes(STATUS.REJECTED)) {
    notificationMsg = `Rejected KYC Verification: "Your KYC verification has been rejected. Please review and re-submit.`;
  }

  notificationService.create({
    userId: user._id,
    message: notificationMsg,
    type: NOTIFICATION_TYPES.IMPORTANT,
  });

  res.json({
    success: true,
    message: "User kyc status updated",
  });
});

exports.updateStatus = catchAsyncErrors(async (req, res, next) => {
  const { reason, isActive, type, id } = req.body || {};

  const userUpdate = { isActive };
  if (!isActive) {
    if (!reason) {
      return next(new ErrorHandler("Please provide a reason!"));
    }
    userUpdate.reason = reason;
  }

  const user = await User.findByIdAndUpdate(id, userUpdate);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 401));
  }
  // Send email notification
  /* await sendEmail({
    email: user.email,
    subject: `Approved KYC verification: “Congratulations! Your KYC verification has been successfully approved. You may now proceed with your withdrawal.
 ${user?.kyc?.status}`,
    message: description,
  }); */

  res.json({
    success: true,
    message: `User status has been updated.`,
  });
});

// Delete user
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const userId = req.params.id;
  const deletedUser = await User.findByIdAndDelete(userId);
  res.json(deletedUser);
});

exports.claimedRewards = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, status } = req?.query || {};
  const pageSize = process.env.RECORDS_PER_PAGE || 15;
  const skip = (page - 1) & pageSize;

  const query = {
    status: STATUS.PENDING,
  };

  if (status) query.status = status;

  const total = await Reward.countDocuments(query);
  const data = await Reward.find(query).skip(skip).limit(pageSize);

  const merged = [];

  for (const reward of data) {
    const user = await User.findOne({
      _id: reward?.userId,
    });
    if (!user) continue;
    const rank = await Rank.findOne({
      _id: new ObjectId(reward?.rankId),
    });
    console.log(rank);
    if (!rank) continue;
    merged.push({ rank, reward, user });
  }

  if (!merged?.length) {
    return res.json({
      success: false,
      data: merged,
    });
  }

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data: merged,
  });
});

exports.updateStatusOfReward = catchAsyncErrors(async (req, res, next) => {
  const { status, rewardId, amount, reason } = req?.body || {};
  const adminId = req?.user?.id;
  if (!rewardId) {
    return next(new ErrorHandler("Please provide a valid data!"));
  } else if (![STATUS.APPROVED, STATUS.REJECTED]?.includes(status) || !status) {
    return next(new ErrorHandler("Please provide a valid status!"));
  } else if (status?.includes(STATUS.APPROVED) && !amount) {
    return next(new ErrorHandler(`Please enter amount`));
  } else if (status?.includes(STATUS.REJECTED) && !reason) {
    return next(new ErrorHandler("please provide reason"));
  }
  const reward = await Reward.findOne({
    _id: rewardId,
    status: STATUS.PENDING,
  });

  if (!reward) {
    return next(new ErrorHandler("Reward Not Found"));
  }

  const rank = await Rank.findOne({ _id: reward?.rankId });
  if (!rank) {
    return next(new ErrorHandler("Rank Not Found"));
  }

  const payload = { status, amount, adminId, reason };
  if (status?.includes(STATUS.APPROVED)) {
    if (amount < rank?.rewardFrom || amount > rank?.rewardTo) {
      return next(
        new ErrorHandler(
          `Reward amount must be between range for ${rank?.title}, ${rank?.rewardFrom} - ${rank?.rewardTo}`
        )
      );
    }
    const user = await User.findOne({ _id: reward?.userId, isActive: true });
    if (!user) {
      return next(new ErrorHandler("User Not Found"));
    }
    rewardBalance = Number(user?.rewardBalance || 0) + Number(amount);
    console.log(user?.rewardBalance, amount);
    await User.updateOne(
      { _id: user?._id },
      {
        $set: {
          rewardBalance,
        },
      }
    );
  }

  await Reward.updateOne({ _id: rewardId }, payload);

  return res.json({
    id: rewardId,
    success: true,
    message: "Reward status updated",
  });
});
