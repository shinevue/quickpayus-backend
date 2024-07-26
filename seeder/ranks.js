const { faker } = require("@faker-js/faker");
const { STATUS } = require("../config/constants");
const moment = require("moment");
const connectDB = require("../config/db");
const User = require("../models/userModel");
const Reward = require("../models/rewardModel");
const Rank = require("../models/rankModel");
const rankCtrl = require("../controllers/ranksController");
connectDB();

async function seedRanks() {
    Rank.deleteMany({});
    try {
        const users = await User.find({});
        const ranks = await Rank.find({});

        for (let i = 1; i < users.length; i++) {
            const date = moment().startOf("year");
            for (let j = 0; j < 1; j++) {
                for (let k = 0; k < 1; k++) {
                    const reward = new Reward();
                    reward.userId = users[i]._id;
                    reward.rankId = ranks[Math.ceil(Math.random() * 4)];
                    reward.status = faker.helpers.arrayElement(Object.values(STATUS));
                    reward.reason = reward.status === "REJECTED" ? faker.lorem.word() : null; // Generate a random reason (3 words)
                    reward.isClaimed = reward.status === 'PENDING' ? true : false;
                    reward.amount = 1000 + Math.ceil(Math.random() * 1000);
                    reward.createdAt = date;
                    await reward.save();
                    console.log(`${i}----------${j}------------${k}`);
                }
                date.add(1, "days");
                if (date.isSame(new Date(), "day")) break;
                rankCtrl.user;
            }
        }
        console.log("Reward seed data saved");
        process.exit(0); // Exit the process after seeding
    } catch (error) {
        console.error("Error seeding rewards:", error);
        process.exit(1); // Exit with error status
    }
}

seedRanks();
