import connectDB from "../config/db";
import User from "../models/userModel";
import { faker } from "@faker-js/faker";

connectDB();

interface UserDummy {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  countryCode: string;
  phoneNumber: number;
  createdAt: Date;
  depositBalance: number;
  rewardBalance: number;
  creditBalance: number;
  profitBalance: number;
  referralId: string;
  password: string;
  investmentLevel: string;
  investmentSubLevel: string;
  termsAndConditions: boolean;
  // Uncomment and define the KYC interface if needed
  // kyc?: {
  //   identification: Array<{
  //     documentType: string;
  //     documentName: string;
  //   }>;
  //   status: string;
  // };
}

const levels: { [key: number]: string } = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
};

const generateDummyUser = (): UserDummy => {
  const level = levels[faker.number.int({ min: 1, max: 5 })];
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    countryCode: faker.location.countryCode(),
    phoneNumber: faker.number.int({ min: 100000000, max: 999999999 }),
    createdAt: faker.date.past(),
    // depositBalance: faker.number.int({ min: 50, max: 500 }),
    depositBalance: 24000,
    rewardBalance: faker.number.int({ min: 50, max: 100 }),
    creditBalance: 0,
    profitBalance: 0,
    referralId: '668c8b23b11e65ea59d66acc',
    password: "111111",
    investmentLevel: level,
    investmentSubLevel: level + faker.number.int({ min: 1, max: 5 }),
    termsAndConditions: true,
    // Uncomment and define the KYC object if needed
    // kyc: {
    //   identification: [
    //     {
    //       documentType: faker.lorem.word(), // Placeholder, replace with appropriate type
    //       documentName: `${faker.person.firstName()} ${faker.person.lastName()} ${faker.lorem.word()}`,
    //     },
    //   ],
    //   status: "APPROVED",
    // },
  };
};

const seedDummyUsers = async (): Promise<void> => {
  console.time("TOTAL_TIME");
  try {
    for (let i = 0; i < 20; i++) {
      const user = new User(generateDummyUser());
      await user.save();
    }
    console.log("User dummy seed data saved");
  } catch (error) {
    console.error("Error seeding dummy users:", error);
    throw error;
  }
  console.timeEnd("TOTAL_TIME");
};

seedDummyUsers();