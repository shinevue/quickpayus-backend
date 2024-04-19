const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const OTP = require("../models/otpModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { sendEmail, emailTemplates } = require("../utils/sendEmail");

exports.create = catchAsyncErrors(async (req, res, next) => {
  const { email, id } = req.user || {};

  const otpModel = new OTP({ userId: id });

  await otpModel.save();

  const otp = otpModel?.code?.toString();

  await sendEmail({
    email: email,
    ...emailTemplates.otpEmailConfirm
  });

  res.json({ success: true, message: "OTP sent successfully on email" });
});

exports.verify = catchAsyncErrors(async (req, res, next) => {
  const { otp } = req?.body || {};
  const { id } = req?.user || {};

  if (!otp) {
    return next(new ErrorHandler("The otp is not defined."));
  }

  const otpRecord = await OTP.findOne({
    userId: id,
    code: otp,
  });

  if (!otpRecord) {
    return next(
      new ErrorHandler("The otp provided is invalid or has expired.", 400)
    );
  }

  return res.json({
    success: true,
    message: "The otp has been successfully verified.",
  });
});
