const { TRANSACTION_TYPES, WITHDRAWAL_TYPES } = require("../config/constants");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const path = require("path");
const fs = require("fs").promises;

exports.kycUpsert = catchAsyncErrors(async (req, res, next) => {
  const userID = req.user.id;
  let user = await User.findById(userID);

  if (req.files && Object.keys(req.files).length > 0) {
    if (user.kyc && user.kyc.images) {
      // Delete previous image files
      await Promise.all(
        user.kyc.images.map(async (file) => {
          const filePath = path.join(
            __dirname,
            `../uploads/kyc/${user.username}`,
            file.name
          );
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.error(`Error deleting file ${filePath}: ${err.message}`);
          }
        })
      );
    }

    if (user.kyc && user.kyc.documents) {
      // Delete previous document files
      await Promise.all(
        user.kyc.documents.map(async (file) => {
          const filePath = path.join(
            __dirname,
            `../uploads/kyc/${user.username}`,
            file.name
          );
          try {
            await fs.unlink(filePath);
          } catch (err) {
            console.error(`Error deleting file ${filePath}: ${err.message}`);
          }
        })
      );
    }

    const imageFiles = req.files.images || [];
    const documentFiles = req.files.documents || [];

    // Ensure the user's KYC directory exists
    const userDir = path.join(__dirname, `../uploads/kyc/${user.username}`);
    await fs.mkdir(userDir, { recursive: true });

    req.body.images = await Promise.all(
      imageFiles.map(async (file) => {
        const destPath = path.join(userDir, file.filename);
        await fs.rename(file.path, destPath);
        return { name: file.filename };
      })
    );

    req.body.documents = await Promise.all(
      documentFiles.map(async (file) => {
        const destPath = path.join(userDir, file.filename);
        await fs.rename(file.path, destPath);
        return { name: file.filename };
      })
    );
  }

  user = await User.findByIdAndUpdate(
    userID,
    { kyc: { ...req.body } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: "KYC updated successfully",
    data: user,
  });
});

exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const userID = req.user.id;
  const { password, ...data } = req.body;
  const user = await User.findById(userID).select("+password");
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
      new ErrorHandler("Please enter correct password and try again.", 400)
    );
  }

  Object.keys(data).forEach(async (key) => {
    const isSame = await user.compareField({ [key]: data[key] });
    if (isSame) {
      return next(
        new ErrorHandler(`Please enter a new ${key} and try again.`, 400)
      );
    }
    user[key] = data[key];
  });
  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

exports.enable2FA = catchAsyncErrors(async (req, res, next) => {
  const userID = req.user.id;
  const user = await User.findById(userID);
  if (!user) {
    return next(
      new ErrorHandler(
        "User not found or not logged In. Please login and try again.",
        400
      )
    );
  }
  user.isEnableMFA = req.body.checked;
  await user
    .save()
    .then(() => {
      res.status(200).json({
        success: true,
        message: "MFA status was changes successfully",
        user,
      });
    })
    .catch(() => {
      res.status(500).json({
        success: false,
        message: "MFA status wasn't changes successfully",
      });
    });
});

exports.balanceByType = async (query) => {
  let balance = 0,
    key = null;

  if (!query?.userId) {
    switch (query?.withdrawalType) {
      case WITHDRAWAL_TYPES.DEPOSIT:
        key = "depositBalance";
        break;
      case WITHDRAWAL_TYPES.PROFIT:
        key = "profitBalance";
        break;
      case WITHDRAWAL_TYPES.REWARD:
        key = "rewardBalance";
        break;
    }

    return { key, balance };
  }

  const user = await User.findById(query?.userId);

  switch (query?.withdrawalType) {
    case WITHDRAWAL_TYPES.DEPOSIT:
      key = "depositBalance";
      balance = user[key] ?? 0;
      break;
    case WITHDRAWAL_TYPES.PROFIT:
      key = "profitBalance";
      balance = user[key] ?? 0;
      break;
    case WITHDRAWAL_TYPES.REWARD:
      key = "rewardBalance";
      balance = user[key] ?? 0;
      break;
  }

  switch (query?.transactionType) {
    case TRANSACTION_TYPES.DEPOSIT:
      key = "depositBalance";
      balance = user[key] ?? 0;
      break;
    case TRANSACTION_TYPES.PROFIT:
      key = "profitBalance";
      balance = user[key] ?? 0;
      break;
    case TRANSACTION_TYPES.REFERRAL_CREDIT:
      key = "creditBalance";
      balance = user[key] ?? 0;
      break;
    case TRANSACTION_TYPES.REWARD:
      key = "rewardBalance";
      balance = user[key] ?? 0;
      break;
  }
  return { key, balance };
};

exports.getUser = catchAsyncErrors(async (req, res, next) => {
  const uuid = req?.params?.uuid;

  const data = await User.findOne({ uuid });

  if (!data) {
    return next(new ErrorHandler("No user found."));
  }

  res.json({
    success: true,
    data,
  });
});

exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const keyword = req.params.key;
  const users = await User.find({
    $or: [
      { email: { $regex: keyword, $options: "i" } },
      { username: { $regex: keyword, $options: "i" } },
    ],
  });

  res.json({ users });
});
