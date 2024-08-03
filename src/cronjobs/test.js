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


const main = async (page, pageSize) => {
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

    // const page = 1;
    // const pageSize = 5000;
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

  // process.exit(0);
};

async function applyNormal() {
  console.time("TOTAL_TIME_TOOK");
  await main(1, 1000);
  console.timeEnd("TOTAL_TIME_TOOK");
}
function applyCronJob() {
  const jobNames = [];
  const { Worker, Queue } = require('bullmq');
  
  const IORedis = require('ioredis');
  const connection = new IORedis({ maxRetriesPerRequest: null });
  
  const queue = new Queue('myQueue', { connection });
  
  let earliestStartTime = Infinity;
  let latestEndTime = 0;
  let completionCounter = 0;
  
  async function removePrevJobs() {
    await queue.getRepeatableJobs().then(async (repeatableJobs) => {
      for (const job of repeatableJobs) {
        queue.removeRepeatableByKey(job.key).then(() => {
          console.log(`previous job ${job.name} removed`);
        }).catch((error) => {
          console.log(error);
        })
      }
    });
  }
  
  async function startWorkers() {
    const worker = new Worker('myQueue', async job => {
      if (jobNames.includes(job.name)) {
  
      } else {
        console.log(`Skipping ${job.name}`);
      }
  
      const startTime = Date.now();
      if (startTime < earliestStartTime) {
          earliestStartTime = startTime;
      }
  
      await main(job.data.page, 500);
  
      const endTime = Date.now();
      if (endTime > latestEndTime) {
          latestEndTime = endTime;
      }
  
      completionCounter ++;
      if (completionCounter === 10) {
          console.log(`Total processing time for ${10} workers is: ${(latestEndTime - earliestStartTime)/1000} seconds`);
  
          earliestStartTime = Infinity;
          latestEndTime = 0
          completionCounter = 0;
      }
    }, { connection });
    worker.on('failed', (job, err) => {
      console.error(`${job.name} failed with error:`, err);
    });
  
    worker.on('completed', (job) => {
      console.log(`${job.name} with id ${job.id} has been completed`);
    });
  }
  
  queue.on('waiting', (job) => {
    console.error(`${job.name} added`);
  });
  
  queue.on('error', (error) => {
    console.log(`Queue error: ${error}`);
  });
  
  async function addJobs() {
    for (let i = 1; i <= 10; i ++) {
      jobNames.push('Job' + i);
      await queue.add('Job' + i, {page: i}, {
        repeat: {
          pattern: '* * * * Mon-Fri',
          endDate: new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)),
          tz: 'America/New_York'
        },
      });
    }
  }
  
  removePrevJobs();
  startWorkers();
  addJobs();  
}

applyNormal();
// applyCronJob();