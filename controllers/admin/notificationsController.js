const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const { Notification } = require("../../models/notificationModel");
const notificationService = require("../../services/notificationService");
const ErrorHandler = require("../../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res, next) => {
  if (!req?.body) {
    return next(new ErrorHandler("No request body found"));
  }

  const alreadyExist = await notificationService.findOne({
    title: req?.body?.title,
  });

  if (alreadyExist)
    return next(
      new ErrorHandler(`Notification already exist with title: ${title}`)
    );
  const data = await notificationService.create({
    ...req.body,
    userId: req.user.username,
  });

  return res.json({
    success: true,
    message: "Notification created successfully",
    data,
  });
});

exports.get = catchAsyncErrors(async (req, res) => {
  const { page = 1 } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const total = await notificationService.countDocuments({
    adminCreated: true,
  });

  if (!total) {
    return next(new ErrorHandler("No Announcements found"));
  }

  const data = await notificationService.paginateQuery(
    { adminCreated: true },
    { page, pageSize }
  );

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data,
  });
});
exports.remove = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.params || {};
  const removed = await this.deleteOne({ _id: id });

  if (removed?.deletedCount) {
    return res.json({
      id,
      success: true,
      message: "Notification deleted successfully",
    });
  }

  return res.json({
    success: false,
    message: "Notification not found",
  });
});

exports.removeAll = catchAsyncErrors(async (req, res) => {});

exports.deleteOne = async (query) => {
  return await Notification.deleteOne(query);
};
