const connectDB = require("../config/db");
const User = require("../models/userModel");
const { faker } = require("@faker-js/faker");

connectDB();

const levels = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
};

const generateDummyUser = () => {
  const level = levels[faker.number.int({ min: 1, max: 5 })];
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    countryCode: faker.location.countryCode(),
    phoneNumber: faker.number.int({ min: 100000000, max: 999999999 }),
    createdAt: faker.date.past(),

    depositBalance: faker.number.int({ min: 50, max: 500 }),

    rewardBalance: faker.number.int({ min: 50, max: 100 }),
    creditBalance: 0,
    profitBalance: 0,
    password: "111111",
    investmentLevel: level,
    investmentSubLevel: level + faker.number.int({ min: 1, max: 5 }),
    termsAndConditions: true,
    // kyc: {
    // identification: [
    //   {
    //     documentType: faker.lorem.word(), // Placeholder, replace with appropriate type
    //     documentName: `${faker.person.firstName()} ${faker.person.lastName()} ${faker.lorem.word()}`,
    //   },
    // ],
    // status: "APPROVED",
    // },`
  };
};

async function seedDummyUsers() {
  console.time("TOTAL_TIME");
  try {
    for (let i = 0; i < 10; i++) {
      //console.log(`Inserting row - ${i}`);
      const user = new User(generateDummyUser());
      await user.save();
    }

    console.log("User dummy seed data saved");
  } catch (error) {
    throw error;
  }
  console.timeEnd("TOTAL_TIME");
}

seedDummyUsers();
