const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { ObjectId } = require("mongodb");
const { DEFAULT_REFERRAL_FIELDS } = require("../config/constants");

exports.getDirectReferrals = async (query, options) => {
  const { page, pageSize, sortBy } = options || {};
  const skip = (page - 1) * pageSize;

  return await User.find(query)
    .sort({ [sortBy]: -1 })
    .skip(skip)
    .limit(pageSize)
    .select(DEFAULT_REFERRAL_FIELDS);
};

exports.directReferralsCount = async (query) => {
  const result = await User.countDocuments(query) || 0;
  return result;
};

exports.getIndirectReferrals = async (query, options) => {
  const { page, pageSize, depth, level, sortBy } = options || {};
  const skip = (page - 1) * pageSize; // Ensure these are numbers
  const sortByKey = `children.${sortBy}`;

  return await User.aggregate([
    {
      $match: query,
    },
    {
      $graphLookup: {
        from: "users",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "referralId",
        as: "children",
        depthField: "sublevel",
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
            input: "$children",
            as: "child",
            in: {
              $mergeObjects: [
                "$$child",
                {
                  sublevel: { $add: ["$$child.sublevel", 2] }, // Adjust if needed
                },
              ],
            },
          },
        },
      },
    },
    { $unwind: "$children" },
    { $sort: { [sortByKey]: -1 } },
    {
      $group: {
        _id: "$_id",
        root: { $first: "$$ROOT" },
        children: { $push: "$children" },
      },
    },
    {
      $addFields: {
        children: {
          $filter: {
            input: "$children",
            as: "child",
            cond: { $eq: ["$$child.sublevel", level] }, // Adjust the condition to match the desired sublevel
          },
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$root", { children: "$children" }],
        },
      },
    },
    {
      $project: {
        ...DEFAULT_REFERRAL_FIELDS,
        children: {
          $map: {
            input: "$children",
            as: "referral",
            in: {
              _id: "$$referral._id",
              investmentLevel: "$$referral.investmentLevel",
              investmentSubLevel: "$$referral.investmentSublevel",
              sublevel: "$$referral.sublevel",
              firstName: "$$referral.firstName",
              lastName: "$$referral.lastName",
              username: "$$referral.username",
              createdAt: "$$referral.createdAt",
            },
          },
        },
      },
    },
    {
      $addFields: {
        childrenCount: { $size: "$children" },
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

exports.indirectReferralsCount = async (query, depth) => {
  const { referralId, ...otherQueryParams } = query;

  const result = await User.aggregate([
    {
      $match: { referralId },
    },
    {
      $graphLookup: {
        from: "users",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "referralId",
        as: "children",
        maxDepth: depth,
        depthField: "sublevel",
      },
    },
    {
      $addFields: {
        children: {
          $map: {
            input: "$children",
            as: "child",
            in: {
              _id: "$$child._id",
              createdAt: "$$child.createdAt"
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

  const allindrectReferrals = result.flatMap(row => row.children || []);

  // Convert other query parameters to match the indirect children
  const filterQuery = { ...otherQueryParams, _id: { $in: allindrectReferrals.map(child => child._id) } };

  // Count the filtered indirect referrals
  const count = await User.countDocuments(filterQuery);
  console.log(otherQueryParams, count)
  return count;
};

exports.referrals = catchAsyncErrors(async (req, res, next) => {
  const userId = new ObjectId(req?.user?.id) || null;
  let referrals = null,
    total = 0,
    pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;

  if (!userId) {
    return next(new ErrorHandler("No user found"));
  }

  const { type, page, level } = req?.query || {};

  const query = { referralId: userId, isActive: true };

  if (type === "DIRECT") {
    total = await this.directReferralsCount(query);
    referrals = await this.getDirectReferrals(query, {
      page: Number(page),
      pageSize,
      sortBy: "createdAt",
    });
  } else if (type === "INDIRECT") {
    if (level > 10) {
      return next(
        new ErrorHandler(
          "Invalid level provided. The level cannot be greator than 8."
        )
      );
    }

    /**
     * We will use this count later;
     */
    // const [indirectCount] = await this.getIndirectReferralsCount(
    //   query,
    //   8,
    //   Number(level) || 2
    // );
    //total = indirectCount?.total;
    referrals = await this.getIndirectReferrals(query, {
      page: Number(page),
      pageSize,
      depth: 8,
      level: Number(level) || 2,
      sortBy: "createdAt",
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
        400
      )
    );
  }

  return res.json({
    message: `Fetched ${type?.toLowerCase()} referrals successfully`,
    total,
    totalPages: Math.ceil(total / pageSize),
    data: referrals,
  });
});

exports.getAllReferrals = async (query, depth) => {
  let indirectRefferals = [];
  try {
    indirectRefferals = await User.aggregate([
      {
        $match: query,
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "referralId",
          as: "children",
          maxDepth: depth,
          depthField: "sublevel",
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
              input: "$children",
              as: "child",
              in: {
                $mergeObjects: [
                  "$$child",
                  {
                    sublevel: { $add: ["$$child.sublevel", 2] },
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          ...DEFAULT_REFERRAL_FIELDS,
          sublevel: 1,
          children: {
            $map: {
              input: "$children",
              as: "child",
              in: {
                _id: "$$child._id",
                investmentLevel: "$$child.investmentLevel",
                firstName: "$$child.firstName",
                lastName: "$$child.lastName",
                username: "$$child.username",
                email: "$$child.email",
                role: "$$child.role",
                depositBalance: "$$child.depositBalance",
                sublevel: "$$child.sublevel",
              },
            },
          },
        },
      },
    ]);

    if (depth && indirectRefferals?.length) {
      const indirect = indirectRefferals?.flatMap((row) => {
        return row?.children ? row.children : [];
      });
      if (indirect?.length) {
        return indirectRefferals?.concat(indirect);
      }
    }
  } catch (err) {
    console.log("Something went wrong getting all referrals", err);
  }

  return indirectRefferals;
};

exports.parentReferrers = async (query) => {
  const referrers =
    (await User.aggregate([
      {
        $match: query,
      },
      {
        $graphLookup: {
          from: "users",
          startWith: "$referralId",
          connectFromField: "referralId",
          connectToField: "_id",
          as: "parents",
          maxDepth: 8,
          depthField: "parentLevel",
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
              input: "$parents",
              as: "child",
              in: {
                $mergeObjects: [
                  "$$child",
                  {
                    parentLevel: { $add: ["$$child.parentLevel", 1] },
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
              input: "$parents",
              as: "referrer",
              in: {
                _id: "$$referrer._id",
                investmentLevel: "$$referrer.investmentLevel",
                investmentSubLevel: "$$referrer.investmentSubLevel",
                parentLevel: "$$referrer.parentLevel",
                depositBalance: "$$referrer.depositBalance",
                referralCreditBalance: "$$referrer.referralCreditBalance",
                firstName: "$$referrer.firstName",
                lastName: "$$referrer.lastName",
                username: "$$referrer.username",
                createdAt: "$$referrer.createdAt",
              },
            },
          },
        },
      },
    ])) || [];

  return referrers?.length ? referrers[0]?.parents : [];
};
exports.getParentReferrers = async (req, res) => {
  const query = {};
  query._id = new ObjectId(req?.user?.id);
  query.isActive = true;
  const data = await this.parentReferrers(query);

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
