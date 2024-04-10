const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/userModel");
const HELPER = require("../helpers/index");
const { ObjectId } = require("mongodb");
const programCtlr = require("../controllers/programController");
const referralCtlr = require("../controllers/referralsController");
const depositCtlr = require("./transactionController");
const { STATUS } = require("../config/constants");

exports.counts = catchAsyncErrors(async (req, res, next) => {
  const userId = new ObjectId(req.user.id) || null;

  const defaultResponse = {
    accountBalance: 0,
    principleBalance: 0,
    profitBalance: 0,
    equityBalance: 0,
    creditBalance: 0,
    rankRewardBalance: 0,
  };

  if (!userId) {
    return res.json(defaultResponse);
  }

  const user = await User.findOne({ _id: userId });

  if (!user) {
    return res.json(defaultResponse);
  }

  const program = await programCtlr.findOne({
    level: user?.investmentLevel,
  });

  const depositQuery = {
    userId,
    status: STATUS.PENDING,
  };

  const transactions = await depositCtlr.find(depositQuery);

  if (transactions?.length) {
    defaultResponse.principleBalance =
      transactions?.reduce((total, { amount }) => {
        return total + amount;
      }, 0) ?? 0;
  }

  const referrals =
    (await referralCtlr.getAllReferrals(
      { referralId: userId, isActive: true },
      8
    )) || [];

  for (const referral of referrals) {
    const query = { referralId: referral?._id, isActive: true };
    const directReferralsCount =
      (await referralCtlr.directReferralsCount(query)) ?? 0;

    const depositQuery = {
      userId: referral?._id,
      status: STATUS.PENDING,
    };

    const transactions = await depositCtlr.find(depositQuery);

    if (!transactions?.length) continue;

    const sumOfAmount = transactions?.reduce((total, { amount }) => {
      return total + amount;
    }, 0);

    const subProgram = program?.data?.find((row) => {
      if (referral?.sublevel == row?.level) {
        //need to add more checks
        return row;
      }
    });
    if (!subProgram) continue;

    console.log(
      referral?.username,
      directReferralsCount,
      subProgram?.level,
      Number(subProgram?.creditPercentage),
      sumOfAmount
    );

    const appliedPercentage = HELPER.applyPercentage(
      sumOfAmount,
      Number(subProgram?.creditPercentage)
    );

    defaultResponse.creditBalance += appliedPercentage;
  }

  return res.json(defaultResponse);
});
