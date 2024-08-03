const config = require("../../config/config");
const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");

const Receiver = require("../../models/receiverAddressModel");
const { isValidAddress } = require("../../utils/trc20Validator");
const notificationService = require("../../services/notificationService");

const {
  NOTIFICATION_TYPES,
} = require("../../config/constants");

exports.getAllReceiver = catchAsyncErrors(async (req, res, next) => {
  const data = await Receiver.find({}).sort({ createdAt: -1 });

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

exports.addReceiver = catchAsyncErrors(async (req, res, next) => {
  const newReceiver = new Receiver({ ...req.body, adminId: req.user.username });
  const { username } = req.user;

  if (isValidAddress(req.body.newAddress))
    newReceiver
      .save()
      .then((receiver) => {
        notificationService.create({
          userId: username,
          title: "RECEIVER ADDRESS CHANGE",
          type: NOTIFICATION_TYPES.ACTIVITY,
          message: `Receiver address changed to ${req.body.newAddress}`,
          adminCreated: true
        });
        res.json({
          success: true,
          msg: "Receiver created successfully:",
          receiver: receiver,
        });
      })
      .catch((error) => {
        res.json({
          success: false,
          msg: error,
        });
      });
  else {
    res.json({
      success: false,
      msg: "Address validation failed.",
    });
  }
});

exports.defaultReceiver = catchAsyncErrors(async (req, res, next) => {
  const count = await Receiver.find();
  if (count.length) {
    console.log("--- Can't create Admin Receiver address ---");
    return;
  }
  const adminAddress = config.adminAddress;

  const newReceiver = new Receiver(adminAddress);
  newReceiver
    .save()
    .then(() => {
      console.log("--- Admin Receiver address created successfully ---");
    })
    .catch(() => {
      console.log("--- Can't create Admin Receiver address ---");
    });
});
