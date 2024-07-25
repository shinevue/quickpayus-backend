const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const notificationService = require("../../services/notificationService");
const ErrorHandler = require("../../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res) => {
  const { id } = req.user || {};

  const res = await notificationService.create(req.body);

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data,
  });
});

exports.get = catchAsyncErrors(async (req, res) => {
  const { page = 1, isRead = false } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const { id } = req.user || {};

  if (isRead === "false") {
    const total = await notificationService.countDocuments({
      userId: id,
      isRead: isRead,
    });
    return res.json({
      success: true,
      total,
    });
  }

  const total = await notificationService.countDocuments({
    userId: id,
  });

  if (!total) {
    return next(new ErrorHandler("No notifications found"));
  }

  const data = await notificationService.paginate(id, { page, pageSize });

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data,
  });
});