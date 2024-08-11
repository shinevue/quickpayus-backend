import connectDB from '../config/db';
import Transaction from '../models/transactionModel';
import User, { IUser } from '../models/userModel';
import mongoose, { Schema } from 'mongoose';
import { ObjectId } from 'mongodb';
import programCtlr from '../controllers/programController';
import referralCtlr from '../controllers/referralsController';
import userCtlr from '../controllers/userController';
import HELPERS from '../helpers';
import config from '../config/constants';

connectDB();

interface TransPayload {
  amount: number;
  userId: mongoose.Types.ObjectId;
  receiverAddress: string;
  senderAddress: string;
  transactionType: string;
  status: string;
  uuid: string;
}

const mockUser: IUser = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'john',
  email: ';;@doe.com',
  phoneNumber: '+1234567890',
  password: 'ASdf!@34',

  termsAndConditions: true,
  isModified: (str: string) => {
    return str;
  },
  backupCodes: ['1'],
  securityQuestion: {
    answer: 'shine',
    question: 1,
  },
  investmentLevel: 'A',
  investmentSubLevel: '1',
};

const typesChild = [
  ['a', 'b', 'c'],
  ['1', '2', '3'],
];

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
    if (depth < 4 && index > 1) return;
    const username = referral + item;
    await createOne(username, referralId).then(async (newUser: any) => {
      const payload: TransPayload = {
        amount: randomBalance(),
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
        // console.log(newUser._id);

        await func(
          transaction.originalAmount,
          transaction.amount,
          transaction.userId,
          'DEPOSIT',
        );
      });

      await createNewUsers(username, 1 - type, depth - 1);
    });
  });
};

const func = async (
  originalAmount: number,
  amount: number,
  userId: any,
  transactionType: string,
) => {
  let keyToUpdate = null;
  let balance = 0;
  const userUpdate: any = {};
  // ======================================================
  const balanceResponse = await userCtlr.balanceByType({
    userId,
    transactionType,
  });
  const program = await programCtlr.findByInvestment(
    originalAmount + balanceResponse?.balance,
  );

  // console.log('program', program, originalAmount, balanceResponse?.balance);

  userUpdate.investmentLevel = program?.level || null;
  keyToUpdate = balanceResponse?.key;
  balance = balanceResponse?.balance;
  userUpdate.$set = {
    [keyToUpdate]: balance,
  };
  userUpdate.investmentLevel = program?.level || null;
  userUpdate.investmentSubLevel = program?.data?.level || null;

  const user = await User.findByIdAndUpdate(userId, userUpdate);
  // console.log('user', user?.username, user?._id);

  if (transactionType.includes(config.TRANSACTION_TYPES.DEPOSIT))
    await updateCreditToParents(user, transactionType, balance);
};

export const updateCreditToParents = async (
  user: any,
  type: string,
  amount: number,
) => {
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

const randomBalance = () => 50 + Math.floor(Math.random() * 4000) / 100;

const createMockUser = async () => {
  try {
    await User.deleteMany({});
    await Transaction.deleteMany({});

    const admin = new User({
      ...mockUser,
      username: 'admin',
      firstName: 'admin',
      lastName: 'admin',
      depositBalance: randomBalance(),
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
      depositBalance: randomBalance(),
      email: 'root@mock.mail',
      password: '123456',
    });

    await root.save();

    await createNewUsers('', 0, 5);

    console.log('User seed data saved');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

createMockUser();
