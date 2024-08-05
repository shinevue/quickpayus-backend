import { faker } from '@faker-js/faker';
import moment from 'moment';
import config from '../config/constants';
import connectDB from '../config/db';
import User, { IUser } from '../models/userModel';
import Transaction, { ITransaction } from '../models/transactionModel';
// import * as transactionCtrl from '../controllers/transactionController';

connectDB();

async function seedTransactions(): Promise<void> {
  try {
    await Transaction.deleteMany({});
    const users: any[] = await User.find({});

    for (let i = 1; i < users.length; i++) {
      let date = moment().startOf('year');

      for (let j = 0; j < 20; j++) {
        for (let k = 0; k < 2; k++) {
          const transaction = new Transaction() as ITransaction; // Cast to ITransaction
          transaction.userId = users[i]._id;
          transaction.adminId = users[0]._id; // Assuming adminId is also fetched similarly
          transaction.reason = faker.lorem.word(); // Generate a random reason
          transaction.status = faker.helpers.arrayElement(
            Object.values(config.STATUS),
          );
          transaction.amount = 10;
          transaction.transactionType = faker.helpers.arrayElement(
            Object.values(config.TRANSACTION_TYPES),
          );

          if (transaction.transactionType === config.TRANSACTION_TYPES.WITHDRAWAL) {
            transaction.withdrawalType = faker.helpers.arrayElement(
              Object.values(config.WITHDRAWAL_TYPES),
            );
          }

          transaction.uuid = faker.string.uuid();
          transaction.senderAddress = faker.location.streetAddress(); // Generate a random street address
          transaction.receiverAddress = faker.location.streetAddress(); // Generate another random street
          transaction.createdAt = date.toDate(); // Convert moment object to JavaScript Date

          await transaction.save();
          console.log(`${i}----------${j}------------${k}`);
        }

        date.add(1, 'days');
        if (date.isSame(new Date(), 'day')) break;
        // transactionCtrl.user; // This line seems incomplete; consider removing or completing it
      }
    }

    console.log('Transaction seed data saved');
    process.exit(0); // Exit the process after seeding
  } catch (error) {
    console.error('Error seeding transactions:', error);
    process.exit(1); // Exit with error status
  }
}

seedTransactions();
