const connectDB = require("../config/db");
const Program = require("../models/programModel");
const Rank = require("../models/rankModel");
connectDB();

const mergedLevels = {
  A: [
    {
      level: 1,
      investment: 50,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 6,
      directReferralsRequired: 1,
      maxDepth: 0,
    },
    {
      level: 2,
      investment: 100,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 5,
      directReferralsRequired: 2,
      maxDepth: 1,
    },
    {
      level: 3,
      investment: 150,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 4,
      directReferralsRequired: 4,
      maxDepth: 2,
    },
    {
      level: 4,
      investment: 200,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 3,
      directReferralsRequired: 6,
      maxDepth: 3,
    },
    {
      level: 5,
      investment: 250,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 2,
      directReferralsRequired: 8,
      maxDepth: 4,
    },
    { level: 6, creditPercentage: 1, directReferralsRequired: 10, maxDepth: 5 },
    {
      level: 7,
      creditPercentage: 0.5,
      directReferralsRequired: 14,
      maxDepth: 6,
    },
    {
      level: 8,
      creditPercentage: 0.5,
      directReferralsRequired: 16,
      maxDepth: 7,
    },
    {
      level: 9,
      creditPercentage: 0.5,
      directReferralsRequired: 18,
      maxDepth: 8,
    },
    {
      level: 10,
      creditPercentage: 0.5,
      directReferralsRequired: 20,
      maxDepth: 9,
    },
  ],
  B: [
    {
      level: 1,
      investment: 500,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 7,
      directReferralsRequired: 1,
      maxDepth: 0,
    },
    {
      level: 2,
      investment: 1000,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 6,
      directReferralsRequired: 2,
      maxDepth: 1,
    },
    {
      level: 3,
      investment: 1500,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 5,
      directReferralsRequired: 4,
      maxDepth: 2,
    },
    {
      level: 4,
      investment: 2000,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 4,
      directReferralsRequired: 6,
      maxDepth: 3,
    },
    {
      level: 5,
      investment: 2500,
      profitPercentFrom: 1,
      profitPercentTo: 5,
      creditPercentage: 3,
      directReferralsRequired: 8,
      maxDepth: 4,
    },
    { level: 6, creditPercentage: 2, directReferralsRequired: 10, maxDepth: 5 },
    {
      level: 7,
      creditPercentage: 0.5,
      directReferralsRequired: 14,
      maxDepth: 6,
    },
    {
      level: 8,
      creditPercentage: 0.5,
      directReferralsRequired: 16,
      maxDepth: 7,
    },
    {
      level: 9,
      creditPercentage: 0.5,
      directReferralsRequired: 18,
      maxDepth: 8,
    },
    {
      level: 10,
      creditPercentage: 0.5,
      directReferralsRequired: 20,
      maxDepth: 9,
    },
  ],
  C: [
    {
      level: 1,
      investment: 3000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 8,
      directReferralsRequired: 1,
      maxDepth: 0,
    },
    {
      level: 2,
      investment: 5000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 7,
      directReferralsRequired: 2,
      maxDepth: 1,
    },
    {
      level: 3,
      investment: 7000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 6,
      directReferralsRequired: 4,
      maxDepth: 2,
    },
    {
      level: 4,
      investment: 10000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 5,
      directReferralsRequired: 6,
      maxDepth: 3,
    },
    {
      level: 5,
      investment: 15000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 4,
      directReferralsRequired: 8,
      maxDepth: 4,
    },
    { level: 6, creditPercentage: 3, directReferralsRequired: 10, maxDepth: 5 },
    {
      level: 7,
      creditPercentage: 0.5,
      directReferralsRequired: 14,
      maxDepth: 6,
    },
    {
      level: 8,
      creditPercentage: 0.5,
      directReferralsRequired: 16,
      maxDepth: 7,
    },
    {
      level: 9,
      creditPercentage: 0.5,
      directReferralsRequired: 18,
      maxDepth: 8,
    },
    {
      level: 10,
      creditPercentage: 0.5,
      directReferralsRequired: 20,
      maxDepth: 9,
    },
  ],
  D: [
    {
      level: 1,
      investment: 20000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 9,
      directReferralsRequired: 1,
      maxDepth: 0,
    },
    {
      level: 2,
      investment: 25000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 8,
      directReferralsRequired: 2,
      maxDepth: 1,
    },
    {
      level: 3,
      investment: 30000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 7,
      directReferralsRequired: 4,
      maxDepth: 2,
    },
    {
      level: 4,
      investment: 40000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 6,
      directReferralsRequired: 6,
      maxDepth: 3,
    },
    {
      level: 5,
      investment: 50000,
      profitPercentFrom: 2,
      profitPercentTo: 6,
      creditPercentage: 5,
      directReferralsRequired: 8,
      maxDepth: 4,
    },
    { level: 6, creditPercentage: 4, directReferralsRequired: 10, maxDepth: 5 },
    {
      level: 7,
      creditPercentage: 0.5,
      directReferralsRequired: 14,
      maxDepth: 6,
    },
    {
      level: 8,
      creditPercentage: 0.5,
      directReferralsRequired: 16,
      maxDepth: 7,
    },
    {
      level: 9,
      creditPercentage: 0.5,
      directReferralsRequired: 18,
      maxDepth: 8,
    },
    {
      level: 10,
      creditPercentage: 0.5,
      directReferralsRequired: 20,
      maxDepth: 9,
    },
  ],
  E: [
    {
      level: 1,
      investment: 75000,
      profitPercentFrom: 5,
      profitPercentTo: 10,
      creditPercentage: 10,
      directReferralsRequired: 1,
      maxDepth: 0,
    },
    {
      level: 2,
      investment: 100000,
      profitPercentFrom: 5,
      profitPercentTo: 10,
      creditPercentage: 9,
      directReferralsRequired: 2,
      maxDepth: 1,
    },
    {
      level: 3,
      investment: 150000,
      profitPercentFrom: 5,
      profitPercentTo: 10,
      creditPercentage: 8,
      directReferralsRequired: 4,
      maxDepth: 2,
    },
    {
      level: 4,
      investment: 300000,
      profitPercentFrom: 5,
      profitPercentTo: 10,
      creditPercentage: 7,
      directReferralsRequired: 6,
      maxDepth: 3,
    },
    {
      level: 5,
      investment: 500000,
      profitPercentFrom: 5,
      profitPercentTo: 10,
      creditPercentage: 6,
      directReferralsRequired: 8,
      maxDepth: 4,
    },
    { level: 6, creditPercentage: 5, directReferralsRequired: 10, maxDepth: 5 },
    {
      level: 7,
      creditPercentage: 0.5,
      directReferralsRequired: 14,
      maxDepth: 6,
    },
    {
      level: 8,
      creditPercentage: 0.5,
      directReferralsRequired: 16,
      maxDepth: 7,
    },
    {
      level: 9,
      creditPercentage: 0.5,
      directReferralsRequired: 18,
      maxDepth: 8,
    },
    {
      level: 10,
      creditPercentage: 0.5,
      directReferralsRequired: 20,
      maxDepth: 9,
    },
  ],
};

const rankSeeder = [
  {
    title: "Leader 1",
    rewardFrom: 300,
    rewardTo: 500,
    requiredSalesFrom: 10000,
    requiredSalesTo: 15000,
    weeklyMeetings: 5,
    directReferralsRequired: 25,
  },
  {
    title: "Leader 2",
    rewardFrom: 750,
    rewardTo: 1500,
    requiredSalesFrom: 30000,
    requiredSalesTo: 50000,
    weeklyMeetings: 5,
    directReferralsRequired: 25,
  },
  {
    title: "Leader 3",
    rewardFrom: 2000,
    rewardTo: 2500,
    requiredSalesFrom: 750000,
    requiredSalesTo: 100000,
    weeklyMeetings: 4,
    directReferralsRequired: 50,
  },
  {
    title: "Leader 4",
    rewardFrom: 3000,
    rewardTo: 7500,
    requiredSalesFrom: 150000,
    requiredSalesTo: 300000,
    weeklyMeetings: 4,
    directReferralsRequired: 50,
  },
  {
    title: "Leader 5",
    rewardFrom: 10000,
    rewardTo: 20000,
    requiredSalesFrom: 500000,
    requiredSalesTo: 1000000,
    weeklyMeetings: 3,
    directReferralsRequired: 100,
  },
];

async function seedLevels(levels) {
  try {
    await Program.deleteMany({});

    for (const key of Object.keys(levels)) {
      // Create a new Program instance with the levels data
      // const data = levels[key];
      // for (const d of data) {
      //   d.level = Number(d.level) + 1;
      // }
      // levels[key] = data;
      const program = new Program({ level: key, data: levels[key] });
      // Save the program to the database
      await program.save();
    }
    console.log("Program seed data saved");
  } catch (error) {
    throw error;
  }
}

async function seedRanks(levels) {
  try {
    await Rank.deleteMany({});

    for (const key of Object.keys(levels)) {
      const rank = new Rank({ ...levels[key] });
      await rank.save();
    }
    console.log("Rank seed data saved");
  } catch (error) {
    throw error;
  }
}

seedLevels(mergedLevels);
seedRanks(rankSeeder);
