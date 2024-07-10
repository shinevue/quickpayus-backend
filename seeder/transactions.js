const { faker } = require("@faker-js/faker");
const moment = require("moment");
const {
  STATUS,
  TRANSACTION_TYPES,
  WITHDRAWAL_TYPES,
} = require("../config/constants");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");
const transactionCtrl = require("../controllers/transactionController");
connectDB();

async function seedTransactions() {
  Transaction.deleteMany();
  try {
    const users = await User.find({});

    for (let i = 1; i < users.length; i++) {
      const date = moment().startOf("year");
      for (let j = 0; j < 365; j++) {
        for (let k = 0; k < 2; k++) {
          const transaction = new Transaction();
          transaction.userId = users[i]._id;
          transaction.adminId = users[0]._id; // Assuming adminId is also fetched similarly
          transaction.reason = faker.lorem.word(); // Generate a random reason (3 words)
          transaction.status = STATUS.APPROVED;
          transaction.amount = 10;
          transaction.transactionType = TRANSACTION_TYPES.DEPOSIT;
          transaction.uuid = faker.string.uuid();
          transaction.senderAddress = faker.location.streetAddress(); // Generate a random street address
          transaction.receiverAddress = faker.location.streetAddress(); // Generate another random street
          transaction.createdAt = date;
          await transaction.save();
          console.log(`${i}----------${j}------------${k}`);
        }
        date.add(1, "days");
        if (date.isSame(new Date(), "day")) break;
        transactionCtrl.user;
      }
    }
    console.log("Transaction seed data saved");
    process.exit(0); // Exit the process after seeding
  } catch (error) {
    console.error("Error seeding transactions:", error);
    process.exit(1); // Exit with error status
  }
}

seedTransactions();
