const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ProfitConfig = require("../../models/profitConfigModel");
const programCtlr = require("../../controllers/programController");
const HELPER = require("../../helpers");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const profitConfigs =
    (await ProfitConfig.find({}).sort({ createdAt: -1 }).exec()) || [];

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
    history: profitConfigs,
  });
});

exports.upsert = catchAsyncErrors(async (req, res, next) => {
  const { profit } = req?.body || {};

  const _profitConfig = new ProfitConfig({ profit });
  const response = await _profitConfig.save();

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
