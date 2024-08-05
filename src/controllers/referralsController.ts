import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/userModel'; // Adjust the import based on your User model
import ErrorHandler from '../utils/errorHandler';
import { ObjectId } from 'mongodb';
import config from '../config/constants';
import catchAsyncErrors from '../middlewares/catchAsyncErrors';

const getDirectReferrals = async (
  query: any,
  options?: { page?: number; pageSize?: number; sortBy?: string },
) => {
  const { page = 1, pageSize = 15, sortBy = 'createdAt' } = options || {};
  const skip = (page - 1) * pageSize;
  return await User.find(query)
    .sort({ [sortBy]: -1 })
    .skip(skip)
    .limit(pageSize)
    .select({
      investmentLevel: 1,
      username: 1,
      firstName: 1,
      lastName: 1,
      depositBalance: 1,
      createdAt: 1,
      investmentSubLevel: 1,
    });
};

const directReferralsCount = async (query: any): Promise<number> => {
  const result = (await User.countDocuments(query)) || 0;
  return result;
};

const getIndirectReferrals = async (
  query: any,
  options?: {
    page?: number;
    pageSize?: number;
    depth?: number;
    level?: number;
    sortBy?: string;
  },
) => {
  const {
    page = 1,
    pageSize = 15,
    depth = 8,
    level = 2,
    sortBy = 'createdAt',
  } = options || {};
  const skip = (page - 1) * pageSize; // Ensure these are numbers
  const sortByKey = `children.${sortBy}`;

  return await User.aggregate([
    {
      $match: query,
    },
    {
      $graphLookup: {
        from: 'users',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'referralId',
        as: 'children',
        depthField: 'sublevel',
        maxDepth: depth,
      },
    },
    {
      $addFields: {
        sublevel: 1,
      },
    },
    {
      $addFields: {
        children: {
          $map: {
            input: '$children',
            as: 'child',
            in: {
              $mergeObjects: [
                '$$child',
                {
                  sublevel: { $add: ['$child.sublevel', 2] }, // Adjust if needed
                },
              ],
            },
          },
        },
      },
    },
    { $unwind: '$children' },
    { $sort: { [sortByKey]: -1 } },
    {
      $group: {
        _id: '$_id',
        root: { $first: '$$ROOT' },
        children: { $push: '$children' },
      },
    },
    {
      $addFields: {
        children: {
          $filter: {
            input: '$children',
            as: 'child',
            cond: { $eq: ['$child.sublevel', level] }, // Adjust the condition to match the desired sublevel
          },
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$root', { children: '$children' }],
        },
      },
    },
    {
      $project: {
        ...config.DEFAULT_REFERRAL_FIELDS,
        children: {
          $map: {
            input: '$children',
            as: 'referral',
            in: {
              _id: '$$referral._id',
              investmentLevel: '$$referral.investmentLevel',
              investmentSubLevel: '$$referral.investmentSublevel',
              sublevel: '$$referral.sublevel',
              firstName: '$$referral.firstName',
              lastName: '$$referral.lastName',
              username: '$$referral.username',
              createdAt: '$$referral.createdAt',
            },
          },
        },
      },
    },
    {
      $addFields: {
        childrenCount: { $size: '$children' },
      },
    },
    {
      $match: {
        childrenCount: { $gt: 0 },
      },
    },
    {
      $sort: {
        [sortBy]: -1,
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: pageSize,
    },
  ]);
};

const indirectReferralsCount = async (query: any, depth: number) => {
  const { referralId, ...otherQueryParams } = query;
  const result = await User.aggregate([
    {
      $match: { referralId },
    },
    {
      $graphLookup: {
        from: 'users',
        startWith: '$_id',
        connectFromField: '_id',
        connectToField: 'referralId',
        as: 'children',
        maxDepth: depth,
        depthField: 'sublevel',
      },
    },
    {
      $addFields: {
        children: {
          $map: {
            input: '$children',
            as: 'child',
            in: {
              _id: '$$child._id',
              createdAt: '$$child.createdAt',
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        children: 1,
      },
    },
  ]);
  const allIndirectReferrals = result.flatMap((row) => row.children || []);
  // Convert other query parameters to match the indirect children
  const filterQuery = {
    ...otherQueryParams,
    _id: { $in: allIndirectReferrals.map((child) => child._id) },
  };
  // Count the filtered indirect referrals
  const count = await User.countDocuments(filterQuery);
  return count;
};

const referrals = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const userId = new ObjectId(req?.user?.id) || null;
    let referrals: any[] = [],
      total = 0,
      pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;

    if (!userId) {
      return next(new ErrorHandler('No user found', 404));
    }

    const { type, page, level } = req?.query || {};
    const query = { referralId: userId, isActive: true };

    if (type === 'DIRECT') {
      total = await directReferralsCount(query);
      referrals = await getDirectReferrals(query, {
        page: Number(page),
        pageSize,
        sortBy: 'createdAt',
      });
    } else if (type === 'INDIRECT') {
      if (level && level > 10) {
        return next(
          new ErrorHandler(
            'Invalid level provided. The level cannot be greater than 10.',
            400,
          ),
        );
      }

      referrals = await getIndirectReferrals(query, {
        page: Number(page),
        pageSize,
        depth: 8,
        level: Number(level) || 2,
        sortBy: 'createdAt',
      });

      referrals = referrals?.flatMap((row) => {
        return row?.children?.length ? row?.children : [];
      });
      total = referrals?.length;
    }

    if (!referrals?.length) {
      return next(
        new ErrorHandler(
          `No ${type?.toLowerCase()} referrals found for the user`,
          400,
        ),
      );
    }

    return res.json({
      message: `Fetched ${type?.toLowerCase()} referrals successfully`,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: referrals,
    });
  },
);

const getAllReferrals = async (query: any, depth: number) => {
  let indirectReferrals: any[] = [];
  try {
    indirectReferrals = await User.aggregate([
      {
        $match: query,
      },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'referralId',
          as: 'children',
          maxDepth: depth,
          depthField: 'sublevel',
        },
      },
      {
        $addFields: {
          sublevel: 1,
        },
      },
      {
        $addFields: {
          children: {
            $map: {
              input: '$children',
              as: 'child',
              in: {
                $mergeObjects: [
                  '$$child',
                  {
                    sublevel: { $add: ['$child.sublevel', 2] },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          ...config.DEFAULT_REFERRAL_FIELDS,
          sublevel: 1,
          children: {
            $map: {
              input: '$children',
              as: 'child',
              in: {
                _id: '$$child._id',
                investmentLevel: '$$child.investmentLevel',
                firstName: '$$child.firstName',
                lastName: '$$child.lastName',
                username: '$$child.username',
                email: '$$child.email',
                role: '$$child.role',
                depositBalance: '$$child.depositBalance',
                sublevel: '$$child.sublevel',
              },
            },
          },
        },
      },
    ]);

    if (depth && indirectReferrals?.length) {
      const indirect = indirectReferrals?.flatMap((row) => {
        return row?.children ? row.children : [];
      });
      if (indirect?.length) {
        return indirectReferrals?.concat(indirect);
      }
    }
  } catch (err) {
    console.log('Something went wrong getting all referrals', err);
  }
  return indirectReferrals;
};

const parentReferrers = async (query: any) => {
  const referrers =
    (await User.aggregate([
      {
        $match: query,
      },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$referralId',
          connectFromField: 'referralId',
          connectToField: '_id',
          as: 'parents',
          maxDepth: 8,
          depthField: 'parentLevel',
        },
      },
      {
        $addFields: {
          parentLevel: 1,
        },
      },
      {
        $addFields: {
          parents: {
            $map: {
              input: '$parents',
              as: 'child',
              in: {
                $mergeObjects: [
                  '$$child',
                  {
                    parentLevel: { $add: ['$child.parentLevel', 1] },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          parents: {
            $map: {
              input: '$parents',
              as: 'referrer',
              in: {
                _id: '$$referrer._id',
                investmentLevel: '$$referrer.investmentLevel',
                investmentSubLevel: '$$referrer.investmentSubLevel',
                parentLevel: '$$referrer.parentLevel',
                depositBalance: '$$referrer.depositBalance',
                referralCreditBalance: '$$referrer.referralCreditBalance',
                firstName: '$$referrer.firstName',
                lastName: '$$referrer.lastName',
                username: '$$referrer.username',
                createdAt: '$$referrer.createdAt',
              },
            },
          },
        },
      },
    ])) || [];
  return referrers?.length ? referrers[0]?.parents : [];
};

const getParentReferrers = async (req: any, res: Response) => {
  const query = {
    _id: new ObjectId(req?.user?.id),
    isActive: true,
  };

  const data = await parentReferrers(query);

  if (!data?.length) {
    return res.json({
      success: false,
      data,
    });
  }

  return res.json({
    success: true,
    data,
  });
};

const referralCtlr = {
  getDirectReferrals,
  directReferralsCount,
  getIndirectReferrals,
  indirectReferralsCount,
  referrals,
  getAllReferrals,
  parentReferrers,
  getParentReferrers,
};

export default referralCtlr;
