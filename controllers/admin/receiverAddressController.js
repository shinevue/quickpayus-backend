const ErrorHandler = require("../../utils/errorHandler");
const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");

const Receiver = require("../../models/receiverAddressModel");

exports.getAllReceiver = catchAsyncErrors(async (req, res, next) => {
  const data = await Receiver.find({});

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
  const newReceiver = new Receiver({...req.body, adminId: req.user.username});

  newReceiver
    .save()
    .then((receiver) => {
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
});
