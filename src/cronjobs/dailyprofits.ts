import connectDB from '../config/db.js';
import User from '../models/userModel.js';
import ProfitConfig from '../models/profitConfigModel.js';
import HELPER from '../helpers/index.js';
import transactionCtlr from '../controllers/transactionController.js';
import notificationService from '../services/notificationService.js';
import config from '../config/constants.js';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

const main = async (page: number, pageSize: number): Promise<void> => {
  try {
    await connectDB();
    const profitConfig: any[] = await ProfitConfig.find()
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();

    if (!profitConfig.length) {
      console.error(`Profit config not found for today,stopped executing job`);
      process.exit(0);
    }

    const profit = profitConfig[0]?.profit || {};
    const query = {
      isActive: true,
      investmentLevel: { $ne: null },
      depositBalance: { $gt: 0 },
    };

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
      const percentage = Number(profit['ABCDE'.indexOf(investmentLevel)] ?? 0);
      const equityBalance =
        Number(referralCreditBalance ?? 0) + Number(depositBalance ?? 0);
      const appliedPercentage = HELPER.applyPercentage(
        equityBalance,
        percentage,
      );
      const updatedProfitBalance = (profitBalance ?? 0) + appliedPercentage;

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

      await transactionCtlr.save(transaction);

      await User.findByIdAndUpdate(id, { profitBalance: updatedProfitBalance });

      await notificationService.create({
        userId: username,
        type: config.NOTIFICATION_TYPES.ACTIVITY,
        title: 'Profit balance updated',
        message: `${config.TRANSACTION_TYPES.PROFIT?.toLowerCase()?.capitalizeFirst()} of amount $${appliedPercentage} has been deposited in your account. ${transactionUUID}`,
      });
    }
  } catch (err) {
    console.log(`Error running the cronjob - ${err}`);
  }
};

async function applyCronJob(): Promise<void> {
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
    const worker = new Worker(
      'myQueue',
      async (job: any) => {
        if (!jobNames.includes(job.name)) {
          console.log(`Skipping ${job.name}`);
          return;
        }

        const startTime = Date.now();
        if (startTime < earliestStartTime) {
          earliestStartTime = startTime;
        }

        await main(job.data.page, 100);
        const endTime = Date.now();
        if (endTime > latestEndTime) {
          latestEndTime = endTime;
        }

        completionCounter++;
        if (completionCounter === 10) {
          console.log(
            `Total processing time for ${10} workers is: ${
              (latestEndTime - earliestStartTime) / 1000
            } seconds`,
          );
          earliestStartTime = Infinity;
          latestEndTime = 0;
          completionCounter = 0;
        }
      },
      { connection },
    );

    worker.on('failed', (job: any, err: Error) => {
      console.error(`${job.name} failed with error:`, err);
    });

    worker.on('completed', (job: any) => {
      console.log(`${job.name} with id ${job.id} has been completed`);
    });
  }

  async function addJobs(): Promise<void> {
    for (let i = 1; i <= 10; i++) {
      jobNames.push('Job' + i);
      await queue.add(
        'Job' + i,
        { page: i },
        {
          repeat: {
            pattern: '0 3-6 * * Mon-Fri',
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          },
        },
      );
    }
  }
  await addJobs();

  queue.on('waiting', (job: any) => {
    console.error(`${job.name} added`);
  });

  queue.on('error', (error: Error) => {
    console.log(`Queue error: ${error}`);
  });

  await startWorkers();
  await removePrevJobs();
}

applyCronJob();

// async function applyNormal(): Promise<void> {
//   console.time('TOTAL_TIME_TOOK');
//   await main(1, 5000);
//   console.timeEnd('TOTAL_TIME_TOOK');
// }

// applyNormal();
