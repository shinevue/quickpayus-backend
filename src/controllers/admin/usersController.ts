import { Request, Response, NextFunction } from 'express';
import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import Reward, { IReward } from '../../models/rewardModel'; // Adjust the import based on your Reward model
import Rank from '../../models/rankModel'; // Adjust the import based on your Rank model
import User, { IUser } from '../../models/userModel'; // Adjust the import based on your User model
import ErrorHandler from '../../utils/errorHandler';
import referralCtrl from '../referralsController';
import config from '../../config/constants';
import { create } from '../../services/notificationService';
// import sendEmail from '../../utils/sendEmail'; // Uncomment if needed

export const get = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      criteria,
      kycStatus,
      page = 1,
      pageSize = 15,
      kyc = false,
      search,
      startDate,
      endDate,
    } = req.query as {
      criteria?: string;
      kycStatus?: string;
      page?: number;
      pageSize?: number;
      kyc?: boolean;
      search?: string;
      startDate?: string;
      endDate?: string;
    };

    const query: any = {};

    if (startDate && endDate) {
      query['kyc.updatedAt'] = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (kyc) {
      if (kycStatus) {
        query['kyc.status'] = kycStatus;
      } else {
        query.kyc = { $exists: true };
      }
    }

    if (search) {
      const regexSearchTerm = new RegExp(search, 'i');
      switch (criteria) {
        case 'name':
          query.$or = [
            { firstName: { $regex: regexSearchTerm } },
            { lastName: { $regex: regexSearchTerm } },
          ];
          break;
        case 'username':
          query.username = { $regex: regexSearchTerm };
          break;
        case 'email':
          query.email = { $regex: regexSearchTerm };
          break;
        default:
          query.$or = [
            { firstName: { $regex: regexSearchTerm } },
            { lastName: { $regex: regexSearchTerm } },
            { username: { $regex: regexSearchTerm } },
            { email: { $regex: regexSearchTerm } },
          ];
          break;
      }
    }

    const data: IUser[] = await User.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const promises = data.map(async (d) => {
      const directCount = await referralCtrl.directReferralsCount({
        referralId: d._id,
      });
      const indirectCount = await referralCtrl.indirectReferralsCount(
        { referralId: d._id },
        8,
      );
      const referredBy = data.find(
        (user) => user?._id?.toString() === d?.referralId?.toString(),
      );
      return {
        ...d.toObject(),
        referredBy: referredBy?.username,
        directCount,
        indirectCount,
      };
    });

    const modified = await Promise.all(promises);
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: modified,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  },
);

export const suspendUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = await User.findByIdAndUpdate(id, req.body);

    res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      user,
    });
  },
);

export const editUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const { name, username, email } = req.body;

    const updateInfo = {
      firstName: name.split(' ')[0],
      lastName: name.split(' ')[1],
      username,
      email,
    };

    const user = await User.findByIdAndUpdate(id, updateInfo);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user,
    });
  },
);

export const getUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const data = await User.findById(id);

    res.json({
      success: true,
      data,
    });
  },
);

export const updateKyc = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, reason, uuid } = req.body || {};
    const adminId = req.user.id;
    let user: IUser | null;

    const userUpdate = {
      $set: {
        'kyc.status': status,
        'kyc.reason': reason,
        'kyc.adminId': adminId,
        ...(status?.includes(config.STATUS.REJECTED)
          ? {
              'kyc.images': [],
              'kyc.documents': [],
            }
          : {}),
      },
    };

    user = await User.findByIdAndUpdate(uuid, userUpdate, { new: true });

    if (!user) {
      return next(new ErrorHandler('User Not Found', 401));
    }

    let notificationMsg = '';
    let link = '';

    if (status?.includes(config.STATUS.APPROVED)) {
      notificationMsg = `Approved KYC Verification: "Congratulations! Your KYC verification has been successfully approved. You may now proceed with your withdrawal.`;
    } else if (status?.includes(config.STATUS.REJECTED)) {
      notificationMsg = `Rejected KYC Verification: "Your KYC verification has been rejected. Please review and re-submit.`;
      link = '/profile';
    } else if (status?.includes(config.STATUS.PENDING)) {
      notificationMsg = `Canceled KYC Verification: "Your KYC verification has been canceled. Please wait and it can take a long.`;
    }

    create({
      userId: user.username,
      title: 'KYC updated',
      message: notificationMsg,
      type: config.NOTIFICATION_TYPES.IMPORTANT,
      link,
    });

    res.json({
      success: true,
      message: 'User kyc status updated',
    });
  },
);

export const updateStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { reason, isActive, type, id } = req.body || {};
    const userUpdate: any = { isActive };

    if (!isActive && !reason) {
      return next(new ErrorHandler('Please provide a reason!'));
    }

    if (!isActive) {
      userUpdate.reason = reason;
    }

    const user = await User.findByIdAndUpdate(id, userUpdate);

    if (!user) {
      return next(new ErrorHandler('User Not Found', 401));
    }

    res.json({
      success: true,
      message: `User status has been updated.`,
    });
  },
);

// Delete user
export const deleteUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);

    res.json(deletedUser);
  },
);

export const claimedRewards = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1, status } = req.query || {};
    const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;
    const skip = (page - 1) * pageSize;

    const query: any = {
      status: config.STATUS.PENDING,
    };

    if (status) query.status = status;

    const total = await Reward.countDocuments(query);
    const data: IReward[] = await Reward.find(query).skip(skip).limit(pageSize);

    const merged = [];

    for (const reward of data) {
      const user = await User.findOne({ _id: reward?.userId });
      if (!user) continue;

      const rank = await Rank.findOne({ _id: new ObjectId(reward?.rankId) });
      if (!rank) continue;

      merged.push({ rank, reward, user });
    }

    if (!merged.length) {
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
  },
);

export const updateStatusOfReward = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, rewardId, amount, reason } = req.body || {};
    const adminId = req.user?.id;

    if (!rewardId) {
      return next(new ErrorHandler('Please provide a valid data!', 400));
    } else if (
      ![config.STATUS.APPROVED, config.STATUS.REJECTED].includes(status) ||
      !status
    ) {
      return next(new ErrorHandler('Please provide a valid status!', 400));
    } else if (status?.includes(config.STATUS.APPROVED) && !amount) {
      return next(new ErrorHandler(`Please enter amount`, 400));
    } else if (status?.includes(config.STATUS.REJECTED) && !reason) {
      return next(new ErrorHandler('please provide reason', 400));
    }

    const reward = await Reward.findOne({
      _id: rewardId,
      status: config.STATUS.PENDING,
    });

    if (!reward) {
      return next(new ErrorHandler('Reward Not Found', 404));
    }

    const rank = await Rank.findOne({ _id: reward?.rankId });
    if (!rank) {
      return next(new ErrorHandler('Rank Not Found', 404));
    }

    const payload = { status, amount, adminId, reason };

    if (status?.includes(config.STATUS.APPROVED)) {
      if (amount < rank?.rewardFrom || amount > rank?.rewardTo) {
        return next(
          new ErrorHandler(
            `Reward amount must be between range for ${rank?.title}, ${rank?.rewardFrom} - ${rank?.rewardTo}`,
            404,
          ),
        );
      }

      const user = await User.findOne({ _id: reward?.userId, isActive: true });
      if (!user) {
        return next(new ErrorHandler('User Not Found', 404));
      }

      const rewardBalance = Number(user?.rewardBalance || 0) + Number(amount);
      await User.updateOne(
        { _id: user?._id },
        {
          $set: {
            rewardBalance,
          },
        },
      );
    }

    await Reward.updateOne({ _id: rewardId }, payload);

    return res.json({
      id: rewardId,
      success: true,
      message: 'Reward status updated',
    });
  },
);

/* export const getUsersWithBalance = async (page, pageSize, query) => {
  try {
    console.log(TRANSACTION_TYPES.DEPOSIT, config.STATUS.APPROVED);
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
                        { $eq: ["$$transaction.status", config.STATUS.APPROVED] },
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
                        { $eq: ["$$transaction.status", config.STATUS.PENDING] },
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
                        { $eq: ["$$transaction.status", config.STATUS.APPROVED] },
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
                        { $ne: ["$$transaction.status", config.STATUS.APPROVED] },
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
                        { $eq: ["$$transaction.status", config.STATUS.APPROVED] },
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
                        { $eq: ["$$transaction.status", config.STATUS.APPROVED] },
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
