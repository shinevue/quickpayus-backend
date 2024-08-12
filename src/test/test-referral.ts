import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

import User, { IUser } from '../models/userModel';
import Transaction from '../models/transactionModel';
import Program from '../models/ProgramModel';

import programCtlr from '../controllers/programController';
import referralCtlr from '../controllers/referralsController';
import userCtlr from '../controllers/userController';

import HELPERS from '../helpers';
import config from '../config/constants';
import connectDB from '../config/db';

connectDB();

//Transaction payload type
interface TransPayload {
  amount: number;
  userId: mongoose.Types.ObjectId;
  receiverAddress: string;
  senderAddress: string;
  transactionType: string;
  status: string;
  uuid: string;
}

// Style of normal user
const mockUser: IUser = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'john',
  email: 'john@doe.com',
  phoneNumber: '+1234567890',
  password: 'ASdf!@34',

  termsAndConditions: true,
  isModified: (str: string) => str,
  backupCodes: ['quickpaybackupcode1'],
  securityQuestion: {
    answer: 'shine',
    question: 1,
  },
};

// To create a new child user, add these letters to the end of the referral username.
const typesChild = [
  ['a', 'b', 'c'],
  ['1', '2', '3'],
];

// Main function for generating Mock-users tree

const createMockUser = async () => {
  try {
    await User.deleteMany({});
    await Transaction.deleteMany({});

    const admin = new User({
      ...mockUser,
      username: 'admin',
      firstName: 'admin',
      lastName: 'admin',
      email: 'admin@mock.mail',
      password: '123456',
      role: 'admin',
    });

    await admin.save();

    const root = new User({
      ...mockUser,
      username: 'root',
      firstName: 'A',
      lastName: 'A',
      email: 'root@mock.mail',
      password: '123456',
    });

    await root.save();

    await createNewUsers('', 0, 20);

    console.log('User seed data saved');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

// Run main function
createMockUser();

// Recursive function to create child user
const createNewUsers = async (
  referral: string,
  type: number,
  depth: number,
) => {
  if (!depth) return;

  let referralId: string = '';

  if (referral) {
    const parentUser = await User.findOne({ username: referral });
    if (parentUser) referralId = parentUser._id.toString();
  } else {
    const parentUser = await User.findOne({ username: 'root' });
    if (parentUser) referralId = parentUser._id.toString();
  }

  typesChild[type].map(async (item, index) => {
    if (depth < 19 && index > 1) return;
    if (depth < 10 && index > 0) return;
    const username = referral + item;
    await createOne(username, referralId).then(async (newUser: any) => {
      const payload: TransPayload = {
        amount: await randomBalance(),
        userId: newUser._id,
        receiverAddress: 'TCCreceivermin3bd5AbXFfAriWEndFzSvY',
        senderAddress: 'TCCsenderdmin3bd5AbXFfAriWEndFzSvY',
        transactionType: 'DEPOSIT',
        status: 'APPROVED',
        uuid: 'null',
      };
      const transaction = new Transaction(payload);
      await transaction.save();

      newUser.depositBalance = transaction.amount;
      await newUser.save().then(async () => {
        await allowCreatedTransactions(
          transaction.originalAmount,
          transaction.userId,
          'DEPOSIT',
        );
      });

      await createNewUsers(username, 1 - type, depth - 1);
    });
  });
};

// add credit value to referral
const allowCreatedTransactions = async (
  originalAmount: number,
  userId: any,
  transactionType: string,
) => {
  let keyToUpdate = null;
  let balance = 0;
  const userUpdate: any = {};
  const balanceResponse = await userCtlr.balanceByType({
    userId,
    transactionType,
  });
  const program = await programCtlr.findByInvestment(
    originalAmount + balanceResponse?.balance,
  );

  keyToUpdate = balanceResponse?.key;
  balance = balanceResponse?.balance;
  userUpdate.$set = { [keyToUpdate]: balance };
  userUpdate.investmentLevel = program?.level || null;
  userUpdate.investmentSubLevel = program?.data?.level || null;

  const user = await User.findByIdAndUpdate(userId, userUpdate);

  if (transactionType.includes(config.TRANSACTION_TYPES.DEPOSIT))
    await updateCreditToParents(user, balance);
};

// Detect parents' credit
const updateCreditToParents = async (user: any, amount: number) => {
  const parentReferralsQuery = {
    _id: new ObjectId(user?._id),
    isActive: true,
  };
  const parentReferrers = await referralCtlr.parentReferrers(
    parentReferralsQuery,
  );

  for (const parent of parentReferrers) {
    if (!parent?.investmentLevel && !parent?.investmentSubLevel) {
      continue;
    }
    const program = await programCtlr.findByLevels({
      level: parent?.investmentLevel,
      sublevel: parent?.investmentSubLevel,
    });
    if (!program?.data?.creditPercentage) continue;

    const appliedCreditPercentage = HELPERS.applyPercentage(
      amount,
      program?.data?.creditPercentage,
    );
    const userUpdate = {
      $set: {
        referralCreditBalance:
          (parent?.referralCreditBalance || 0) + appliedCreditPercentage,
      },
    };
    const parentId = new ObjectId(parent?._id);
    await User.findByIdAndUpdate(parentId, userUpdate);
  }
};

// Create new user based mock user with username and referralId
const createOne = async (username: string, referralId: string) => {
  const user = new User({
    ...mockUser,
    username: username,
    firstName: username,
    lastName: username,
    email: `${username}@mock.mail`,
    password: '123456',
    referralId,
  });

  await user.save();
  return user;
};

// Select random balance from Program database
const randomBalance = async (): Promise<number> => {
  const programs = await Program.find({});
  let optionList: number[] = [];
  programs.map((program: any) => {
    program.data.map((item: any) => {
      if (item.investment) optionList.push(item.investment);
    });
  });

  if (!optionList?.length) {
    console.error('Not found programs database.');
  }
  return optionList.sort((a, b) => 0.5 - Math.random())[0];
};
