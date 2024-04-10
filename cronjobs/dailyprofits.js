const connectDB = require("../config/db.js");
const User = require("../models/userModel");
const ProfitConfig = require("../models/profitConfigModel");
const HELPER = require("../helpers");
const transactionCtlr = require("../controllers/transactionController");
const notificationService = require("../services/notificationService");

const {
  TRANSACTION_TYPES,
  NOTIFICATION_TYPES,
  STATUS,
} = require("../config/constants.js");

const main = async () => {
  console.time("TOTAL_TIME_TOOK");

  try {
    await connectDB();

    const profitConfig =
      (await ProfitConfig.find().sort({ createdAt: -1 }).limit(1).exec()) || [];

    if (!profitConfig?.length) {
      console.error(
        `Profit config not found for today, stopped executing the job!`
      );
      process.exit(0);
    }

    const profit = profitConfig[0]?.profit || {};

    const query = {
      isActive: true,
      investmentLevel: {
        $ne: null,
      },
      depositBalance: {
        $gt: 0,
      },
    };

    const page = 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    const total = await User.countDocuments(query);

    if (!total) {
      console.error(`No users found to run, stopped executing the job!`);
      process.exit(0);
    }

    const users = await User.find(query).skip(skip).limit(pageSize);

    console.log(`Running cronjob for total users ${users?.length}`);

    for (const user of users) {
      const {
        id,
        referralCreditBalance,
        profitBalance,
        depositBalance,
        username,
        investmentLevel,
      } = user || {};

      if (!investmentLevel) continue;

      console.log(`<------- Updating user (${username}) profit------->`);

      const percentage = Number(profit[investmentLevel] ?? 0);

      const equityBalance =
        Number(referralCreditBalance ?? 0) + Number(depositBalance ?? 0);

      const appliedPercentage = HELPER.applyPercentage(
        equityBalance,
        percentage
      );

      const updatedProfitBalance = profitBalance + appliedPercentage ?? 0;

      console.log(
        percentage,
        referralCreditBalance,
        depositBalance,
        appliedPercentage,
        updatedProfitBalance
      );

      console.log(
        `------- Updating user with percentage (${percentage}) profit (${username}) - ${updatedProfitBalance}-------`
      );

      if (!updatedProfitBalance) continue;

      const transactionUUID = HELPER.uuid();

      const transaction = {
        amount: appliedPercentage,
        userId: id,
        transactionType: TRANSACTION_TYPES.PROFIT,
        uuid: transactionUUID,
        status: STATUS.APPROVED,
        feesAmount: 0,
        originalAmount: equityBalance,
        profitPercentage: percentage,
      };

      console.log(transaction);

      await transactionCtlr.save(transaction);

      // await notificationService.create({
      //   userId: id,
      //   type: NOTIFICATION_TYPES.ACTIVITY,
      //   message: `${TRANSACTION_TYPES.PROFIT?.toLowerCase()?.capitalizeFirst()} of amount $${appliedPercentage} has been deposited in your account. ${transactionUUID}`,
      // });

      //

      /* await transactionCtlr.save(payload);

      await User.findByIdAndUpdate(id, { profitBalance: updatedProfitBalance });

      notificationService.create({
        userId: id,
        type: NOTIFICATION_TYPES.ACTIVITY,
        message: `${TRANSACTION_TYPES.PROFIT?.toLowerCase()?.capitalizeFirst()} of amount $${appliedPercentage} has been deposited in your account. ${transactionUUID}`,
      }) */
    }
  } catch (err) {
    console.log(`Error running the cronjob - ${err}`);
  }

  console.timeEnd("TOTAL_TIME_TOOK");
  process.exit(0);
};

main();
