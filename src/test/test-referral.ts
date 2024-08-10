import connectDB from '../config/db';
import { ObjectId } from 'mongodb';
import User, { IUser } from '../models/userModel';

connectDB();

const mockUser: IUser = {
  firstName: 'John',
  lastName: 'Doe',
  username: 'john',
  email: ';;@doe.com',
  phoneNumber: '+1234567890',
  password: 'ASdf!@34',

  // referralId: new ObjectId("66b411a74a75546191f2c2b1"),
  // depositBalance: 127,

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

interface CreateUserType {
  referral: string;
  type: number;
}

const typesChild = [
  ['a', 'b', 'c'],
  ['1', '2', '3'],
];

const createOne = (referral: string, item: string, referralId: string) => {
  const username = referral + item;
  const user = new User({
    ...mockUser,
    username: username,
    firstName: username,
    lastName: username,
    depositBalance: 10 + Math.ceil(Math.random() * 1000) / 100,
    email: `${username}@mock.mail`,
    password: '123456',
    referralId,
  });

  user.save();
};

const createNewUsers = async ({ referral, type }: CreateUserType) => {
  let referralId: string = '';

  if (referral) {
    const parentUser = await User.findOne({ username: referral });
    if (parentUser) referralId = parentUser._id.toString();
  } else {
    const parentUser = await User.findOne({ username: 'root' });
    if (parentUser) referralId = parentUser._id.toString();
  }

  typesChild[type].map((item) => {
    createOne(referral, item, referralId);
  });
};

const randomBalance = () => 10 + Math.floor(Math.random() * 4000) / 100;

const init = async () => {
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

    createNewUsers({ referral: '', type: 0 });

    console.log('User seed data saved');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

init();
