const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const notificationService = require("../services/notificationService");
const ErrorHandler = require("../utils/errorHandler");

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, isRead = false } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const { username, id } = req.user || {};

  const query = {
    $or: [
      {
        userId: username,
        isRead: isRead,
      },
      { adminCreated: true },
      {
        userId: id,
        isRead: isRead,
      },
    ],
  };

  if (isRead === "false") {
    const total = await notificationService.countDocuments(query);
    console.log(total);
    return res.json({
      success: true,
      total,
    });
  }

  const total = await notificationService.countDocuments(query);

  if (!total) {
    return res.json({
      success: false,
      message: "No notifications found",
      total,

    });
  }

  const data = await notificationService.paginateQuery(
    query,
    { page, pageSize }
  );

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data,
  });
});

exports.updateMany = catchAsyncErrors(async (req, res) => {
  const { id, username } = req.user;
  await notificationService.updateMany({
    $or: [
      {
        userId: username,
        isRead: false,
      },
      { adminCreated: true },
      {
        userId: id,
        isRead: false,
      },
    ]
  }, { isRead: true });
  return res.json({
    success: true,
  });
});

exports.deleteMany = catchAsyncErrors(async (req, res) => {
  const { id, username } = req.user;
  await notificationService.deleteMany({
    $or: [
      {
        userId: username,
        isRead: false,
      },
      { adminCreated: true },
      {
        userId: id,
        isRead: false,
      },
    ]
  }, { isRead: true });
  return res.json({
    success: true,
  });
});

exports.updateRead = catchAsyncErrors(async (req, res) => {
  const { id } = req.params
  await notificationService.update(id, { isRead: true })
  return res.json({
    success: true,
  });
});

exports.deleteOne = catchAsyncErrors(async (req, res) => {
  const { id } = req.params
  await notificationService.deleteOne(id)
  return res.json({
    success: true,
  });
});
