const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const User = require("../../models/userModel");
const { STATUS, TRANSACTION_TYPES } = require("../../config/constants");
const transactionCtlr = require("../../controllers/admin/transactionController");

exports.counts = catchAsyncErrors(async (req, res, next) => {
  const totalUsers = await User.countDocuments({});
  const [{ totalInvestments }] =
    (await User.aggregate([
      {
        $group: {
          _id: null,
          totalInvestments: { $sum: "$depositBalance" },
        },
      },
      { $unset: ["_id"] },
    ])) || [];

  const totalFeeProfit = await transactionCtlr.totalSumByKey("$feesAmount");

  const totalPendingWithdrawals = await transactionCtlr.countDocuments({
    transactionType: TRANSACTION_TYPES.WITHDRAWAL,
    status: STATUS.PENDING,
  });

  const totalPendingDeposits = await transactionCtlr.countDocuments({
    transactionType: TRANSACTION_TYPES.DEPOSIT,
    status: STATUS.PENDING,
  });

  const totalApprovedDeposits = await transactionCtlr.countDocuments({
    transactionType: TRANSACTION_TYPES.DEPOSIT,
    status: STATUS.APPROVED,
  });

  const totalApprovedWithdrawals = await transactionCtlr.countDocuments({
    transactionType: TRANSACTION_TYPES.WITHDRAWAL,
    status: STATUS.APPROVED,
  });

  const totalRejectedDeposits = await transactionCtlr.countDocuments({
    transactionType: TRANSACTION_TYPES.DEPOSIT,
    status: STATUS.REJECTED,
  });

  const totalRejectedWithdrawals = await transactionCtlr.countDocuments({
    transactionType: TRANSACTION_TYPES.WITHDRAWAL,
    status: STATUS.REJECTED,
  });

  return res.json({
    success: true,
    totalUsers,
    totalInvestments,
    totalFeeProfit,
    totalPendingWithdrawals,
    totalPendingDeposits,
    totalApprovedDeposits,
    totalApprovedWithdrawals,
    totalRejectedDeposits,
    totalRejectedWithdrawals,
    overallDeposts:
      totalPendingDeposits + totalApprovedDeposits + totalRejectedDeposits,
    overallWithdrawals:
      totalPendingWithdrawals +
      totalApprovedWithdrawals +
      totalRejectedWithdrawals,
  });
});
