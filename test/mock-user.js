const faker = require('faker');
const connectDB = require('../config/db');
const User = require('../models/userModel');
const ProfitConfig = require('../models/profitConfigModel');
const HELPER = require("../helpers");

connectDB();

function insertUsers(num) {
    try {
        for (let i = 0; i < num; i++) {
            const newUser = new User({
                uuid: HELPER.randomUUID(),
                firstName: faker.name.firstName(),
                lastName: faker.name.lastName(),
                username: faker.internet.userName(),
                email: faker.internet.email(),
                countryCode: '1',
                phoneNumber: '12340000' + ('0000' + i).slice(-4),
                referralId: null,
                password: '123456',
                termsAndConditions: true,

                depositBalance: 100,
                rewardBalance: 0,
                alertNotifications: true,
                emailNotifications: true
            });
            newUser.save();
        }

        const profit = new ProfitConfig({profit: 1000});
        profit.save();
    } catch(e) {
        console.error('----------Error inserting users:', e);
    }
}

insertUsers(1000);