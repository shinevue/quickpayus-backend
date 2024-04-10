const ErrorHandler = require("../utils/errorHandler");
const verifyCaptcha = require("../utils/recaptchaVerifier");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.isCaptchaVerified = catchAsyncErrors(async (req, res, next) => {
  const result = await verifyCaptcha(recaptchaToken);
  if (!result) {
    return next(
      new ErrorHandler(
        "Something went wrong validating re-captcha. Please try again",
        401
      )
    );
  }
  next();
});
