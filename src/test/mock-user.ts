import connectDB from '../config/db';
import User from '../models/userModel';
import { randomUUID } from '../helpers/index';
import { fakerEN as faker } from '@faker-js/faker';
// import ProfitConfig from '../models/profitConfigModel';

connectDB();

async function insertUsers(num: number): Promise<void> {
  try {
    for (let i = 0; i < num; i++) {
      const newUser = new User({
        uuid: randomUUID(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        username: `${faker.internet.userName()}${i}`,
        email: `${faker.internet.userName()}.${i}@mail.com`,
        countryCode: '1',
        phoneNumber: `12340000${('0000' + i).slice(-4)}`,
        referralId: null,
        investmentLevel: 'A',
        investmentSubLevel: 'A2',
        password: '123456',
        termsAndConditions: true,
        depositBalance: 100,
        rewardBalance: 0,
        alertNotifications: true,
        emailNotifications: true,
      });
      await newUser.save();
    }
    console.log(`Done ${num} users!`);
    // Uncomment if needed
    // const profit = new ProfitConfig({ profit: [50, 100, 150, 200] });
    // await profit.save();
  } catch (e) {
    console.error('----------Error inserting users:', e);
  }
}

async function updateUserReferrals(limit: number): Promise<void> {
  try {
    const firstUsers = await User.find({}).limit(10).exec();
    const users = await User.find({}).skip(10).limit(limit).exec();

    for (const user of users) {
      user.referralId =
        firstUsers[Math.floor(Math.random() * firstUsers.length)]._id;
      await user.save();
      console.log(
        `------------------Done updating user with id: ${user._id}--------------`,
      );
    }
  } catch (e) {
    console.error('----------Error updating users:', e);
  }
}

async function seedUser(): Promise<void> {
  await insertUsers(100);
  await updateUserReferrals(100);
  process.exit(0);
}

seedUser();
