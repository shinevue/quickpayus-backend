import connectDB from '../config/db';
import User from '../models/userModel';
import ProfitConfig from '../models/profitConfigModel';
import HELPER from '../helpers/index';
import transactionCtlr from '../controllers/transactionController';
import notificationService from '../services/notificationService';
import config from '../config/constants';
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import moment from 'moment-timezone';

// Define the user type based on your User model
interface UserType {
  id: string;
  email: string;
  referralCreditBalance: number;
  profitBalance: number;
  depositBalance: number;
  username: string;
  investmentLevel: string | null;
  timeZone?: string;
}

// Create a connection to Redis
const connection = new IORedis({ maxRetriesPerRequest: null });
const queue = new Queue('myQueue', { connection });

const main = async (userId: string): Promise<void> => {
  try {
    const profitConfig: any = await ProfitConfig.find()
      .sort({ createdAt: -1 })
      .limit(1)
      .exec();

    if (!profitConfig.length) {
      console.error(`Profit config not found for today, stopped executing job`);
      process.exit(0);
    }

    const profit: number[] = profitConfig[0]?.profit || [];
    const query = {
      username: userId,
      isActive: true,
      investmentLevel: { $ne: null },
      depositBalance: { $gt: 0 },
    };

    const user: UserType | null = await User.findOne(query);

    if (!user) {
      console.error(`User not found with ID: ${userId}`);
      return;
    }

    console.log(`Running cronjob for user: ${user.email}`);

    const {
      id,
      referralCreditBalance,
      profitBalance,
      depositBalance,
      username,
      investmentLevel,
    } = user as any;

    console.log(`<------- Updating user (${username}) profit ------->`);

    const percentage = Number(profit['ABCDE'.indexOf(investmentLevel)] ?? 0);
    const equityBalance =
      Number(referralCreditBalance ?? 0) + Number(depositBalance ?? 0);
    const appliedPercentage = HELPER.applyPercentage(equityBalance, percentage);
    const updatedProfitBalance = (profitBalance ?? 0) + appliedPercentage;

    console.log(
      `------- Updating user with percentage (${percentage}) profit (${username}) - ${updatedProfitBalance} -------`,
    );

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

    queue.add(
      'Job of ' + user.username,
      { userId: user.username, timeZone: user.timeZone },
      { delay: 24 * 60 * 60 * 1000 },
    );

    await notificationService.create({
      userId: username,
      type: config.NOTIFICATION_TYPES.ACTIVITY,
      title: 'Profit balance updated',
      message: `${config.TRANSACTION_TYPES.PROFIT?.toLowerCase()?.capitalizeFirst()} of amount $${appliedPercentage} has been deposited in your account. ${transactionUUID}`,
    });
  } catch (err) {
    console.log(`Error running the cronjob - ${err}`);
  }
};

async function applyCronJob(): Promise<void> {
  console.time('TOTAL_TIME_TOOK');
  await connectDB();

  const jobNames: string[] = [];
  const usersAll: UserType[] = await User.find({ role: 'user' });

  let earliestStartTime = Infinity;
  let latestEndTime = 0;
  let completionCounter = 0;

  function scheduleProfitDispatch(user: UserType): void {
    const userTimeZone = user.timeZone || 'America/New_York';
    const currentTime = moment().tz(userTimeZone);
    const targetTime = moment.tz('03:00', 'HH:mm', userTimeZone);

    // If target time is earlier than current time, schedule for the next day
    if (currentTime.isAfter(targetTime)) {
      targetTime.add(1, 'day');
    }

    // Calculate delay
    let delay = targetTime.diff(currentTime);
    if (delay < 0) delay += 24 * 60 * 60 * 1000;

    // Enqueue job with delay
    queue.add(
      'Job of ' + user.username,
      { userId: user.username, timeZone: userTimeZone },
      { delay },
    );

    // console.log(`{
    //   'Job of ' + ${user.username},
    //   { username: ${user.username}, timeZone: ${userTimeZone} },
    //   { delay: ${delay} }}`,
    // );
  }

  async function addJobs(): Promise<void> {
    for (const user of usersAll) scheduleProfitDispatch(user);
  }

  async function startWorkers(): Promise<void> {
    console.log('A start work');
    const worker = new Worker(
      'myQueue',
      async (job) => {
        if (!jobNames.includes(job.name)) {
          console.log(`Skipping ${job.name}`);
          return;
        }

        const startTime = Date.now();
        if (startTime < earliestStartTime) {
          earliestStartTime = startTime;
        }

        await main(job.data.userId);

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

  async function removePrevJobs(): Promise<void> {
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await queue.removeRepeatableByKey(job.key);
      console.log(`previous job ${job.name} removed`);
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
  removePrevJobs();
  console.timeEnd('TOTAL_TIME_TOOK');
}

applyCronJob();
