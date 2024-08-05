import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import User from '../../models/userModel';
import Ticket from '../../models/ticketModel';
import Transaction from '../../models/transactionModel';
import config from '../../config/constants';
// import transactionCtlr from "./transactionController";
// import Rank from '../../models/rankModel';
import Program from '../../models/ProgramModel';
import { Request, Response, NextFunction } from 'express';

interface UserMetrics {
  totalRegisteredUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalReferrals: number;
}

interface KYCMetrics {
  approved: number;
  rejected: number;
  pending: number;
}

interface DepositMetrics {
  approved: number;
  rejected: number;
  pending: number;
  totalCreditsDispatched: number;
}

interface TicketMetrics {
  resolved: number;
  pending: number;
}

interface ProgramStatistics {
  level: string;
  users: number;
}

interface UserDemographics {
  topCountries: any[];
  topBrowsers: any[];
  topOS: any[];
}

export const counts = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const userMetrics = await getUserMetrics();
    const kycMetrics = await getKYCMetrics();
    const depositMetrics = await getDepositMetrics();
    const ticketMetrics = await getTicketMetrics();
    const programStatistics = await getProgramStatistics();

    const userDemographics: UserDemographics = {
      topCountries: await getTopCountries(),
      topBrowsers: await getTopBrowsers(),
      topOS: await getTopOS(),
    };

    console.log(userDemographics);

    res.status(200).json({
      userMetrics,
      kycMetrics,
      depositMetrics,
      ticketMetrics,
      programStatistics,
      userDemographics,
    });
  },
);

const getUserMetrics = async (): Promise<UserMetrics> => {
  const result: UserMetrics = {
    totalRegisteredUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalReferrals: 0,
  };

  result.activeUsers = await User.countDocuments({ isActive: true });
  result.inactiveUsers = await User.countDocuments({ isActive: false });
  result.totalRegisteredUsers = result.activeUsers + result.inactiveUsers;
  result.totalReferrals = await User.countDocuments({
    referralId: { $ne: null },
  });

  return result;
};

const getKYCMetrics = async (): Promise<KYCMetrics> => {
  const result: KYCMetrics = {
    approved: 0,
    rejected: 0,
    pending: 0,
  };

  result.approved = await User.countDocuments({
    'kyc.status': config.STATUS.APPROVED,
  });
  result.rejected = await User.countDocuments({
    'kyc.status': config.STATUS.REJECTED,
  });
  result.pending = await User.countDocuments({
    'kyc.status': config.STATUS.PENDING,
  });

  return result;
};

const getDepositMetrics = async (): Promise<DepositMetrics> => {
  const result: DepositMetrics = {
    approved: 0,
    rejected: 0,
    pending: 0,
    totalCreditsDispatched: 0,
  };

  result.approved = await Transaction.countDocuments({
    transactionType: config.TRANSACTION_TYPES.DEPOSIT,
    status: config.STATUS.APPROVED,
  });
  result.rejected = await Transaction.countDocuments({
    transactionType: config.TRANSACTION_TYPES.DEPOSIT,
    status: config.STATUS.REJECTED,
  });
  result.pending = await Transaction.countDocuments({
    transactionType: config.TRANSACTION_TYPES.DEPOSIT,
    status: config.STATUS.PENDING,
  });

  const totalCreditsDispatched = await Transaction.aggregate([
    {
      $match: {
        transactionType: config.TRANSACTION_TYPES.DEPOSIT,
        status: config.STATUS.APPROVED,
      },
    },
    {
      $group: {
        _id: null,
        totalCreditsDispatched: { $sum: '$amount' },
      },
    },
  ]);

  result.totalCreditsDispatched =
    totalCreditsDispatched[0]?.totalCreditsDispatched || 0;
  return result;
};

const getTicketMetrics = async (): Promise<TicketMetrics> => {
  const result: TicketMetrics = {
    resolved: 0,
    pending: 0,
  };

  result.resolved = await Ticket.countDocuments({ status: 'RESOLVED' });
  result.pending = await Ticket.countDocuments({ status: 'PENDING' });

  return result;
};

const getProgramStatistics = async (): Promise<ProgramStatistics[]> => {
  const result = await Program.aggregate([
    {
      $group: {
        _id: '$level',
        users: { $sum: 0 },
      },
    },
    {
      $addFields: {
        level: '$_id',
      },
    },
  ]);

  const result2 = await User.aggregate([
    {
      $group: {
        _id: '$investmentLevel',
        users: { $sum: 1 },
      },
    },
  ]);

  return result.map((pro) => {
    const u = result2.find((r) => r._id === pro.level);
    return {
      level: pro.level,
      users: u?.users || 0,
    };
  });
};

const getTopCountries = async (): Promise<any[]> => {
  const result = await User.aggregate([
    {
      $group: {
        _id: '$countryCode',
        users: { $sum: 1 },
      },
    },
    {
      $addFields: {
        country: '$_id',
      },
    },
    {
      $sort: { users: -1 },
    },
    {
      $limit: 15,
    },
  ]);
  return result;
};

const getTopBrowsers = async (): Promise<any[]> => {
  const result = await User.aggregate([
    {
      $group: {
        _id: '$browser',
        users: { $sum: 1 },
      },
    },
    {
      $addFields: {
        browsers: '$_id',
      },
    },
    {
      $sort: { users: -1 },
    },
    {
      $limit: 5,
    },
  ]);
  return result;
};

const getTopOS = async (): Promise<any[]> => {
  const result = await User.aggregate([
    {
      $group: {
        _id: '$os',
        users: { $sum: 1 },
      },
    },
    {
      $addFields: {
        oss: '$_id',
      },
    },
    {
      $sort: { users: -1 },
    },
    {
      $limit: 5,
    },
  ]);
  return result;
};
