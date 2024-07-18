const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ProfitConfig = require("../../models/profitConfigModel");
const programCtlr = require("../../controllers/programController");
const HELPER = require("../../helpers");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const profitConfigs =
    (await ProfitConfig.find({}).sort({ createdAt: -1 }).limit(1).exec()) || [];

  if (!profitConfigs?.length) {
    return res.json({
      success: false,
      data: [],
    });
  }
  const profit = profitConfigs[0]?.profit || {};

  return res.json({
    success: true,
    data: profit,
  });
});

exports.upsert = catchAsyncErrors(async (req, res, next) => {
  const { profit } = req?.body || {};

  const query = {
    createdAt: { $gte: HELPER.startOfToday(), $lte: HELPER.endOfToday() },
  };

  const profitConfig = await ProfitConfig.findOne(query);

  let response = null;

  if (!profitConfig) {
    const _profitConfig = new ProfitConfig({ profit });
    response = await _profitConfig.save();
  } else {
    response = await ProfitConfig.findByIdAndUpdate(
      profitConfig?._id,
      {
        profit,
      },
      { new: true }
    );
  }

  if (!response) {
    return next(
      new ErrorHandler("Something went wrong updating profit config!")
    );
  }

  return res.json({
    success: true,
    message: "Profit config upserted successfully",
    data: response,
  });
});
