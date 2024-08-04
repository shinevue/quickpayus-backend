import connectDB from "../config/db.js";
import User from "../models/userModel.js";
import HELPER from "../helpers";
import { fakerEN as faker } from "@faker-js/faker";

import ProfitConfig from "../models/profitConfigModel.js";

connectDB();

async function insertUsers(num) {
  try {
    for (let i = 0; i < num; i++) {
      const newUser = new User({
        uuid: HELPER.randomUUID(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        username: faker.internet.userName() + i,
        email: `${faker.internet.userName()}.${i}@mail.com`,
        countryCode: "1",
        phoneNumber: "12340000" + ("0000" + i).slice(-4),
        referralId: null,
        investmentLevel: "A",
        investmentSubLevel: "A2",
        password: "123456",
        termsAndConditions: true,

        depositBalance: 100,
        rewardBalance: 0,
        alertNotifications: true,
        emailNotifications: true,
      });
      await newUser.save();
    }
    console.log(`Done ${num} users!`);

    // const profit = new ProfitConfig({ profit: [50, 100, 150, 200] });
    // profit.save();
  } catch (e) {
    console.error("----------Error inserting users:", e);
  }
}

async function updateUserReferrals(limit) {
  try {
    let firstUser = await User.find({}).limit(10);
    let users = await User.find({}).skip(10).limit(limit);
    users.forEach(async (user, index) => {
      user.referralId = firstUser[Math.floor(Math.random() * 10)]._id;
      await user.save();
      console.log(`------------------Done ${index} user--------------`);
    });
  } catch (e) {
    console.error("----------Error updating users:", e);
  }
}

async function seedUser() {
  await insertUsers(100);
  await updateUserReferrals(100);
  process.exit(0);
}

seedUser();
