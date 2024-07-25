const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const notificationService = require("../../services/notificationService");
const ErrorHandler = require("../../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res) => {
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

  const data = await notificationService.create(req.body);

  return res.json({
    success: true,
    message: "Notification created successfully",
    data,
  });
});

exports.get = catchAsyncErrors(async (req, res) => {
  const { page = 1 } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const total = await notificationService.countDocuments({});

  if (!total) {
    return next(new ErrorHandler("No Announcements found"));
  }

  const data = await notificationService.paginate(
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
exports.remove = catchAsyncErrors(async (req, res) => {})
exports.removeAll = catchAsyncErrors(async (req, res) => {})