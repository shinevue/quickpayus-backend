const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const verifyCaptcha = require("../utils/recaptchaVerifier");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const { sendEmail } = require("../utils/sendEmail");
const crypto = require("crypto");

exports.checkAuth = catchAsyncErrors(async (req, res, next) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
});

exports.createUser = catchAsyncErrors(async (req, res, next) => {
  // const captchaResult = await verifyCaptcha(req.body.recaptchaToken);
  // if (!captchaResult) {
  //   return next(new ErrorHandler("Something went wrong Please try again", 401));
  // }

  const { referral } = req?.body || {};
  let referralId = null;

  if (referral) {
    const parentUser = await User.findOne({ username: referral });

    if (parentUser) referralId = parentUser?._id || parentUser?.id;
  }
  
  const primaryColorsList = ["#007AFF", "#34C759", "#FF3B30", "#FFCC00", "#FF9500", "#00C7BE", "#FF2D55", "#AF52DE", "#5856D6"]
  const secondaryColorsList = ["#D5E4F4", "#E7F8EB", "#FFE7E6", "#FFF9E0", "#FFF2E0", "#E0F8F7", "#FFE6EB", "#F5EAFB", "#EBEBFA"]
  const randomIndex = Math.floor(Math.random() * primaryColorsList.length);

  const user = new User({...req.body, avatarBg: `linear-gradient(180deg, ${primaryColorsList[randomIndex]} 0%, ${secondaryColorsList[randomIndex]} 150%)`});

  user.referralId = referralId;

  const saved = await user.save();
  res.json({ success: true, message: "User Created", data: saved});
});

exports.signin = catchAsyncErrors(async (req, res, next) => {
  const { password, email, recaptchaToken } = req.body;
  /* const captchaResult = await verifyCaptcha(recaptchaToken);
  if (!captchaResult) {
    return next(new ErrorHandler("Something went wrong Please try again", 401));
  } */
  if (!email || !password) {
    return next(
      new ErrorHandler("Please enter email or username and password", 400)
    );
  }
  const user = await User.findOne({
    $or: [{ email: email }, { username: email }],
  }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Credientials", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Credientials", 401));
  }
  user.isDeleted = 0;
  await user.save();
  sendToken(user, 200, res);
});

exports.signout = catchAsyncErrors(async (req, res, next) => {
  // res.cookie("token", null, {
  //   expires: new Date(Date.now()),
  //   httpOnly: true,
  // });
  res.json({
    success: true,
    message: "Signed Out Successfully",
  });
});

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { pwd, userId, check } = req.body;
  const user = await User.findById(userId).select("+password");
  const isPasswordMatched = await user.comparePassword(pwd);
  if (check) {
    if (!isPasswordMatched) {
      return next(new ErrorHandler("Wrong Password", 401));
    } else {
      return res.json({ success: true });
    }
  } else {
    await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: 1,
        isDeletedAt: new Date(),
      },
      { new: true }
    );
    res.json({
      success: true,
    });
  }
});

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  // const captchaResult = await verifyCaptcha(req.body.recaptchaToken);
  // if (!captchaResult) {
  //   return next(new ErrorHandler("Something went wrong Please try again", 401));
  // }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("user not found", 404));
  }
  const resetToken = user.setResetPasswordToken();
  const resetPasswordUrl = `${req.protocol}://${req.get(
    "host"
  )}/auth/password/reset/${resetToken}`;
  await user.save({ validateBeforeSave: false });
  try {
    await sendEmail({
      email: user.email,
      subject: "Forgot Password",
      message: resetPasswordUrl,
    });
    res.json({
      success: true,
      message: "SUCCESS",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // const captchaResult = await verifyCaptcha(req.body.recaptchaToken);
  // if (!captchaResult) {
  //   return next(new ErrorHandler("Something went wrong Please try again", 401));
  // }
  const { password, confirmPassword } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "reset password  token is invalid or has been expired",
        400
      )
    );
  }
  if (password !== confirmPassword) {
    new ErrorHandler("password does not match with confirm password", 400);
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({
    success: true,
    message: "Reset Password Successfully",
  });
});

exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.user || {};
  const { oldPassword, password } = req.body || {};

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(
      new ErrorHandler(
        "User not found or not logged In. Please login and try again.",
        400
      )
    );
  }

  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) {
    return next(
      new ErrorHandler("Please enter correct old password and try again.", 400)
    );
  }

  user.password = password;
  await user.save();

  res.json({
    success: true,
    message: "Password Changed Successfully",
  });
});

exports.checkDataExist = catchAsyncErrors(async (req, res, next) => {
  const { username, email, mobileNo, countryCode, recaptchaToken } =
    req.body || {};
  // const captchaResult = await verifyCaptcha(recaptchaToken);
  // if (!captchaResult) {
  //   return next(new ErrorHandler("Something went wrong Please try again", 401));
  // }

  const emailExist = await User.findOne({ email });

  if (emailExist) {
    return next(
      new ErrorHandler(
        "Email already exists. Please choose another to continue.",
        201
      )
    );
  }

  const usernameExist = await User.findOne({ username });

  if (usernameExist) {
    return next(
      new ErrorHandler(
        "Username already exists. Please choose another to continue.",
        201
      )
    );
  }

  const mobileNoExist = await User.findOne({
    $and: [{ countryCode }, { mobileNo }],
  });

  if (mobileNoExist) {
    return next(
      new ErrorHandler(
        "Phone number already exists. Please choose another to continue.",
        201
      )
    );
  }

  res.json({
    success: true,
  });
});

exports.usernameToName = catchAsyncErrors(async (req, res, next) => {
  const { username, recaptchaToken } = req.body || {};
  // const captchaResult = await verifyCaptcha(recaptchaToken);

  // if (!captchaResult) {
  //   return next(new ErrorHandler("Something went wrong Please try again", 401));
  // }

  if (!username) {
    return next(new ErrorHandler("Invalid data provided", 201));
  }

  const user = await User.findOne({ username });

  if (!user) return res.json({ success: false });

  return res.json({
    success: true,
    data: {
      firstName: user?.firstName,
      lastName: user?.lastName,
    },
  });
});

exports.deactivateAccount = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.user || {};
  const { password } = req.body || {};

  const user = await User.findById(id).select("+password");

  if (!user) {
    return next(
      new ErrorHandler(
        "User not found or not logged In. Please login and try again.",
        400
      )
    );
  }

  const isMatched = await user.comparePassword(password);

  if (!isMatched) {
    return next(
      new ErrorHandler("Please enter correct old password and try again.", 400)
    );
  }

  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: "Account deactivated Successfully",
    data: user,
  });
});

exports.checkDeletedUser = async () => {
  const cutoffTime = Date.now() - 14 * 24 * 60 * 60 * 1000; // 7 days ago in milliseconds
  const resultUsers = await User.find({
    isDeleted: 1,
    isDeletedAt: { $lt: new Date(cutoffTime).toISOString() },
  });
  await User.deleteMany({ _id: { $in: resultUsers.map((user) => user._id) } });
};
