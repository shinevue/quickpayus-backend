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

const init = async () => {
  try {
    await User.deleteMany({});
    const A = new User({
      ...mockUser,
      username: 'A',
      firstName: 'A',
      lastName: 'A',
      depositBalance: 10 + Math.ceil(Math.random() * 1000) / 100,
      email: 'a@a.a',
      password: '123456',
      isAdmin: true,
    });
    console.log(A);

    A.save();
    console.log('User seed data saved');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

init();
