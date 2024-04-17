const connectDB = require("../config/db.js");
const User = require("../models/userModel.js");
const HELPER = require('../helpers');
const { fakerEN: faker } = require('@faker-js/faker');

const ProfitConfig = require('../models/profitConfigModel.js')

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
                countryCode: '1',
                phoneNumber: '12340000' + ('0000' + i).slice(-4),
                referralId: null,
                investmentLevel: 'A',
                investmentSubLevel: 'A2',
                password: '123456',
                termsAndConditions: true,

                depositBalance: 100,
                rewardBalance: 0,
                alertNotifications: true,
                emailNotifications: true
            });
            await newUser.save();
        }
        console.log('Done 5000 users!')

        // const profit = new ProfitConfig({ profit: [50, 100, 150, 200] });
        // profit.save();
    } catch (e) {
        console.error('----------Error inserting users:', e);
    }
}

insertUsers(5000);
