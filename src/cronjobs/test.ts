import connectDB from '../config/db.js';
import User, { IUser } from '../models/userModel';
import ProfitConfig from '../models/profitConfigModel';
import HELPER from '../helpers';
import transactionCtlr from '../controllers/transactionController';
import notificationService from '../services/notificationService';
import config from '../config/constants.js';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

// Define interfaces for user and profit config
interface ProfitConfigType {
  profit: { [key: string]: number }; // Assuming profit is an object with keys as investment levels
}

const main = async (page: number, pageSize: number): Promise<void> => {
  try {
    await connectDB();

    const profitConfig: any[] = await ProfitConfig.find()
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();

    if (!profitConfig.length) {
      console.error(`Profit config not found for today, stopped executing the job!`);
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

    const skip = (page - 1) * pageSize;
    const total = await User.countDocuments(query);
    if (!total) {
      console.error(`No users found to run, stopped executing the job!`);
      process.exit(0);
    }

    const users: IUser[] = await User.find(query).skip(skip).limit(pageSize);
    console.log(`Running cronjob for total users ${users.length}`);

    for (const user of users) {
      const {
        _id: id,
        referralCreditBalance,
        profitBalance,
        depositBalance,
        username,
        investmentLevel,
      } = user;

      if (!investmentLevel) continue;

      console.log(`<------- Updating user (${username}) profit------->`);
      const percentage = Number(profit[investmentLevel] ?? 0);
      const equityBalance = Number(referralCreditBalance ?? 0) + Number(depositBalance ?? 0);
      const appliedPercentage = HELPER.applyPercentage(equityBalance, percentage);
      const updatedProfitBalance = profitBalance ?? 0 + appliedPercentage ?? 0;

      console.log(
        percentage,
        referralCreditBalance,
        depositBalance,
        appliedPercentage,
        updatedProfitBalance,
      );

      console.log(
        `------- Updating user with percentage (${percentage}) profit (${username}) - ${updatedProfitBalance}-------`,
      );

      if (!updatedProfitBalance) continue;

      const transactionUUID = HELPER.uuid();
      const transaction = {
        amount: appliedPercentage,
        userId: id,
        transactionType: config.TRANSACTION_TYPES.PROFIT,
        uuid: transactionUUID,
        status: config.STATUS.APPROVED,
        feesAmount: 0,
        originalAmount: equityBalance,
        profitPercentage: percentage,
      };

      console.log(transaction);
      await transactionCtlr.save(transaction);
      // Uncomment to send notifications
      // await notificationService.create({
      //   userId: id,
      //   type: config.NOTIFICATION_TYPES.ACTIVITY,
      //   message: `${config.TRANSACTION_TYPES.PROFIT?.toLowerCase()?.capitalizeFirst()} of amount $${appliedPercentage} has been deposited in your account. ${transactionUUID}`,
      // });
    }
  } catch (err) {
    console.log(`Error running the cronjob - ${err}`);
  }
};

async function applyNormal(): Promise<void> {
  console.time('TOTAL_TIME_TOOK');
  await main(1, 1000);
  console.timeEnd('TOTAL_TIME_TOOK');
}

function applyCronJob(): void {
  const jobNames: string[] = [];
  const connection = new IORedis({ maxRetriesPerRequest: null });
  const queue = new Queue('myQueue', { connection });
  let earliestStartTime = Infinity;
  let latestEndTime = 0;
  let completionCounter = 0;

  async function removePrevJobs(): Promise<void> {
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await queue.removeRepeatableByKey(job.key);
      console.log(`previous job ${job.name} removed`);
    }
  }

  async function startWorkers(): Promise<void> {
    const worker = new Worker('myQueue', async (job: any) => {
      if (!jobNames.includes(job.name)) {
        console.log(`Skipping ${job.name}`);
        return;
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

      completionCounter++;
      if (completionCounter === 10) {
        console.log(
          `Total processing time for ${10} workers is: ${(latestEndTime - earliestStartTime) / 1000} seconds`,
        );
        earliestStartTime = Infinity;
        latestEndTime = 0;
        completionCounter = 0;
      }
    }, { connection });

    worker.on('failed', (job: any, err: Error) => {
      console.error(`${job.name} failed with error:`, err);
    });

    worker.on('completed', (job: any) => {
      console.log(`${job.name} with id ${job.id} has been completed`);
    });
  }

  queue.on('waiting', (job: any) => {
    console.error(`${job.name} added`);
  });

  queue.on('error', (error: Error) => {
    console.log(`Queue error: ${error}`);
  });

  async function addJobs(): Promise<void> {
    for (let i = 1; i <= 10; i++) {
      jobNames.push('Job' + i);
      await queue.add(
        'Job' + i,
        { page: i },
        {
          repeat: {
            pattern: '* * * * Mon-Fri',
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            tz: 'America/New_York',
          },
        },
      );
    }
  }

  removePrevJobs();
  startWorkers();
  addJobs();
}

// Uncomment to run the normal job
applyNormal();
// Uncomment to run the cron job
// applyCronJob();