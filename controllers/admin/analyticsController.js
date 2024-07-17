const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const User = require("../../models/userModel");
const Ticket = require("../../models/ticketModel")
const Transaction = require("../../models/transactionModel")
const { STATUS, TRANSACTION_TYPES } = require("../../config/constants");
const transactionCtlr = require("../../controllers/admin/transactionController");
const Rank = require("../../models/rankModel");
const Program = require("../../models/programModel");

exports.counts = catchAsyncErrors(async (req, res, next) => {
  const userMetrics = await getUserMetrics();
  const kycMetrics = await getKYCMetrics();
  const depositMetrics = await getDepositMetrics();
  const ticketMetrics = await getTicketMetrics();
  const programStatistics = await getProgramStatistics();
  const userDemographics = {
    topCountries: await getTopCountries(),
    topBrowsers: await getTopBrowsers(),
    topOS: await getTopOS(),
  }
  console.log(userDemographics)
  res.status(200).json({
    userMetrics, kycMetrics, depositMetrics, ticketMetrics
    , programStatistics, userDemographics
  })
});

const getUserMetrics = async () => {
  const result = {
    totalRegisteredUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalReferrals: 0
  }

  result.activeUsers = await User.countDocuments({
    isActive: true
  });

  result.inactiveUsers = await User.countDocuments({
    isActive: false
  });

  result.totalRegisteredUsers = result.activeUsers + result.inactiveUsers;

  result.totalReferrals = await User.countDocuments({
    referralId: { $ne: null }
  });

  return result;
}
const getKYCMetrics = async () => {
  const result = {
    approved: 0,
    rejected: 0,
    pending: 0,
  }
  result.approved = await User.countDocuments({
    'kyc.status': STATUS.APPROVED
  });
  result.rejected = await User.countDocuments({
    'kyc.status': STATUS.REJECTED
  });
  result.pending = await User.countDocuments({
    'kyc.status': STATUS.PENDING
  });

  return result;
}

const getDepositMetrics = async () => {
  const result = {
    approved: 0,
    rejected: 0,
    pending: 0,
    totalCreditsDispatched: 0,
  }

  result.approved = await Transaction.countDocuments({
    transactionType: TRANSACTION_TYPES.DEPOSIT,
    status: STATUS.APPROVED
  })
  result.rejected = await Transaction.countDocuments({
    transactionType: TRANSACTION_TYPES.DEPOSIT,
    status: STATUS.REJECTED
  })
  result.pending = await Transaction.countDocuments({
    transactionType: TRANSACTION_TYPES.DEPOSIT,
    status: STATUS.PENDING
  })

  const totalCreditsDispatched = await Transaction.aggregate([
    {
      $match: {
        transactionType: TRANSACTION_TYPES.DEPOSIT,
        status: STATUS.APPROVED
      }
    },
    {
      $group: {
        _id: null,
        totalCreditsDispatched: { $sum: '$amount' },
      }
    }
  ])

  result.totalCreditsDispatched = totalCreditsDispatched[0].totalCreditsDispatched;
  return result;
}

const getTicketMetrics = async () => {
  const result = {
    resolved: 0,
    pending: 0,
  }

  result.resolved = await Ticket.countDocuments({
    status: "RESOLVED"
  })
  result.pending = await Ticket.countDocuments({
    status: "PENDING"
  })

  return result;
}

const getProgramStatistics = async () => {
  // const result = await Program.aggregate([
  //   {
  //     $group: {
  //       _id: "$level",
  //       count: { $sum: 0 }
  //     }
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       pipeline: [
  //         {
  //           $group: {
  //             _id: "$investmentLevel",
  //             count: { $sum: 1 }
  //           }
  //         }
  //       ],
  //       as: "userCounts"
  //     }
  //   },
  //   {
  //     $unwind: "$userCounts"
  //   },
  //   {
  //     $project: {
  //       _id: 0,
  //       level: "$_id",
  //       users: "$userCounts.count"
  //     }
  //   }
  // ]);
  const result = await Program.aggregate([
    {
      $group: {
        _id: "$level",
        users: { $sum: 0 }
      }
    },
    {
      $addFields: {
        level: "$_id"
      }
    }
  ]);
  const result2 = await User.aggregate([{
    $group: {
      _id: "$investmentLevel",
      users: { $sum: 1 }
    }
  }]);
  return result.map(pro => {
    const u = result2.find((r) => r._id === pro.level)
    return {
      level: pro.level,
      users: u?.users || 0
    }
  });
}

const getTopCountries = async () => {
  const result = await User.aggregate([{
    $group: {
      _id: "$countryCode",
      users: { $sum: 1 }
    }
  }, {
    $addFields: {
      country: "$_id",
    }
  }, {
    $sort: { users: -1 }
  },
  {
    $limit: 5
  }])
  return result;
}

const getTopBrowsers = async () => {
  const result = await User.aggregate([
    {
      $group: {
        _id: "$browser",
        users: { $sum: 1 }
      }
    },
    {
      $addFields: {
        browsers: "$_id",
      }
    },
    {
      $sort: { users: -1 }
    },
    {
      $limit: 5
    }
  ]);
  return result;
}

const getTopOS = async () => {
  const result = await User.aggregate([
    {
      $group: {
        _id: "$os",
        users: { $sum: 1 }
      }
    },
    {
      $addFields: {
        browser: "$_id",
      }
    },
    {
      $sort: { users: -1 }
    },
    {
      $limit: 5
    }
  ]);
  return result;
}