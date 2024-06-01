const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Program = require("../models/programModel");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const programs = await Program.find({});

  if (!programs?.length) {
    return res.json({
      success: false,
      data: [],
    });
  }
  res.json({
    success: true,
    data: programs,
  });
});

exports.findByInvestment = async (investment) => {
  const program = await Program.findOne(
    {
      "data.investment": { $lte: investment },
    },

    { level: 1, data: 1, _id: 0 }
  )
    .sort({ "data.investment": -1 })
    .limit(1);

  if (!program) return null;
  const { level, data } = program;
  const selectedData = data
    .reverse()
    .find((item) => item?.investment <= investment);

  return { level, data: selectedData || {} };
};

exports.findByLevels = async (query) => {
  const program = await Program.findOne(
    {
      level: String(query?.level),
    },

    { level: 1, data: 1, _id: 0 }
  ).limit(1);

  if (!program) return null;

  const { level, data } = program;

  const selectedData = data.find(
    (item) => item?.level === String(query?.sublevel)
  );

  return { level, data: selectedData };
};

exports.find = async (query) => {
  return await Program.find(query);
};

exports.findOne = async (query) => {
  return await Program.findOne(query);
};
