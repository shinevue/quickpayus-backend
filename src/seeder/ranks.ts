import { faker } from '@faker-js/faker';
import config from '../config/constants';
import moment from 'moment';
import connectDB from '../config/db';
import User, { IUser } from '../models/userModel';
import Reward, { IReward } from '../models/rewardModel';
import Rank, { IRank } from '../models/rankModel';
// import * as rankCtrl from '../controllers/ranksController';

connectDB();

async function seedRanks(): Promise<void> {
  try {
    await Rank.deleteMany({});
    const users: IUser[] = await User.find({});
    const ranks: IRank[] = await Rank.find({});

    for (let i = 1; i < users.length; i++) {
      let date = moment().startOf('year');

      for (let j = 0; j < 1; j++) {
        for (let k = 0; k < 1; k++) {
          const reward = new Reward({
            userId: users[i]._id,
            rankId: ranks[Math.ceil(Math.random() * 4)]._id,
            status: faker.helpers.arrayElement(Object.values(config.STATUS)),
            amount: 1000 + Math.ceil(Math.random() * 1000),
          });
          reward.reason =
            reward.status === 'REJECTED' ? faker.lorem.word() : null; // Generate a random reason
          reward.isClaimed = reward.status === 'PENDING';
          await reward.save();
          console.log(`${i}----------${j}------------${k}`);
        }
        date.add(1, 'days');
        if (date.isSame(new Date(), 'day')) break;
        // rankCtrl.user; // This line seems incomplete; consider removing or completing it
      }
    }
    console.log('Reward seed data saved');
    process.exit(0); // Exit the process after seeding
  } catch (error) {
    console.error('Error seeding rewards:', error);
    process.exit(1); // Exit with error status
  }
}

seedRanks();
