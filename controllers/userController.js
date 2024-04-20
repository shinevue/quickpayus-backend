const { TRANSACTION_TYPES, WITHDRAWAL_TYPES } = require("../config/constants");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const path = require("path");
const fs = require("fs").promises;
exports.kycUpsert = catchAsyncErrors(async (req, res, next) => {
  const userID = req.user.id;
  let user = await User.findById(userID);

  console.log('----', req.files);
  if (req.files && req.files.length > 0) {   
    if (user.kyc && user.kyc.images) {
      // Delete previous files
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
            // console.error(`Error deleting file ${filePath}: ${err.message}`);
          }
        })
      );
    }
    if (user.kyc && user.kyc.documents) {
      // Delete previous files
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
            // console.error(`Error deleting file ${filePath}: ${err.message}`);
          }
        })
      );
    }

    req.body.images = req.body.images || [];

    req.body.images.push(
      ...imageFiles.map((file) => ({
        name: file.filename,
      }))
    );

    req.body.documents = req.body.documents || [];

    req.body.documents.push(
      ...documentFiles.map((file) => ({
        name: file.filename,
      }))
    );
  }
  user = await User.findByIdAndUpdate(userID, { kyc: req.body }, { new: true });

  res.status(200).json({
    success: true,
    message: "KYC updated successfully",
    data: user,
  });
});
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const userID = req.user.id;
  const user = await User.findByIdAndUpdate(userID, req.body, { new: true });
  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
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
