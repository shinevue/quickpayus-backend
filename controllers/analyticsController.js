const moment = require("moment");
const { ObjectId } = require("mongodb");

const User = require("../models/userModel");
const HELPER = require("../helpers/index");

const { STATUS, ANALYTICS_TYPE } = require("../config/constants");

const programCtlr = require("./programController");
const referralCtlr = require("./referralsController");
const depositCtlr = require("./transactionController");

const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

exports.counts = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  const defaultResponse = {
    accountBalance: user.depositBalance + user.profitBalance,
    profitBalance: user.profitBalance,
    depositBalance: user.depositBalance,
    equityBalance: user.referralCreditBalance + user.depositBalance,
    creditBalance: user.referralCreditBalance,
    rankRewardBalance: user.rankRewardBalance,
  };

  res.json(defaultResponse);
});

exports.getBalanceInformation = catchAsyncErrors(async (req, res, next) => {
  const userId = new ObjectId(req.user.id) || null;
  const { balanceframe, timeframe } = req.params;

  const balanceInformation = [];

  const dateQueries = generateDateQuery(timeframe);

  let userBalanceFunction;
  switch (balanceframe) {
    case ANALYTICS_TYPE.CREDIT:
      userBalanceFunction = depositCtlr.userCreditBalanceByQuery;
      break;
    case ANALYTICS_TYPE.PROFIT:
      userBalanceFunction = depositCtlr.userProfitBalanceByQuery;
      break;
    case ANALYTICS_TYPE.REWARD:
      userBalanceFunction = depositCtlr.userRewardBalanceByQuery;
      break;
  }

  for (let i = 0; i < dateQueries.length; i++) {
    balanceInformation.push(
      await userBalanceFunction(userId, {
        createdAt: dateQueries[i],
      })
    );
  }

  res.status(200).json(balanceInformation);
});

function generateDateQuery(timeframe) {
  let dateQueries = [];

  let start, end, last, unit;

  switch (timeframe) {
    case "day":
      unit = "days";
      start = moment().startOf("month");
      last = moment().endOf("month");
      break;
    case "week":
      unit = "weeks";
      start = moment().startOf("month");
      last = moment().endOf("month");
      break;
    case "month":
      unit = "months";
      start = moment().startOf("year");
      last = moment().endOf("year");
      break;
    default:
      throw new Error("Invalid date type");
  }

  while (start < last) {
    end = moment(start).add(1, unit);
    dateQueries.push({
      $gte: start.toDate(),
      $lte: end.toDate(),
    });
    start = end;
  }

  return dateQueries;
}
