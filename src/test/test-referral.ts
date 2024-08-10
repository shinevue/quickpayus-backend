import connectDB from '../config/db';
import Transaction from '../models/transactionModel';
import User, { IUser } from '../models/userModel';
import mongoose, { Schema } from 'mongoose';

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
    if (depth < 9 && index > 1) return;
    const username = referral + item;
    createOne(username, referralId).then(async () => {
      const userId = new mongoose.Types.ObjectId(referralId); // Use mongoose.Types.ObjectId
      const payload: TransPayload = {
        amount: randomBalance(),
        userId: userId,
        receiverAddress: 'TCCreceivermin3bd5AbXFfAriWEndFzSvY',
        senderAddress: 'TCCsenderdmin3bd5AbXFfAriWEndFzSvY',
        transactionType: 'DEPOSIT',
        status: 'APPROVED',
        uuid: 'null',
      };
      const transaction = new Transaction(payload);
      await transaction.save();

      await createNewUsers(username, 1 - type, depth - 1);
    });
  });
};

const randomBalance = () => 10 + Math.floor(Math.random() * 4000) / 100;

const createMockUser = async () => {
  try {
    await User.deleteMany({});

    const root = new User({
      ...mockUser,
      username: 'root',
      firstName: 'A',
      lastName: 'A',
      depositBalance: randomBalance(),
      email: 'root@mock.mail',
      password: '123456',
      role: 'admin',
    });

    await root.save();

    createNewUsers('', 0, 10);

    console.log('User seed data saved');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

createMockUser();
