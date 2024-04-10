const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const ranksCtlr = require("../ranksController");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const data =await ranksCtlr.find({});

  if (!data?.length) {
    return res.json({
      success: false,
      data: [],
    });
  }

  return res.json({
    success: true,
    data,
  });
});
