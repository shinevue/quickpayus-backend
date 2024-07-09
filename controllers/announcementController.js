const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { Announcements } = require("../models/announcementModel");
const ErrorHandler = require("../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res, next) => {
  if (!req?.body) {
    return next(new ErrorHandler("No request body found"));
  }

  const alreadyExist = await this.findOne({ title: req?.body?.title });

  if (alreadyExist)
    return next(
      new ErrorHandler(`Announcement already exist with title: ${title}`)
    );

  const data = await this.save({ ...req?.body });

  return res.json({
    success: true,
    message: "Announcement created successfully",
    data,
  });
});

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { page = 1 } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const total = await this.countDocuments({});

  if (!total) {
    return next(new ErrorHandler("No Announcements found"));
  }

  const data = await this.paginate({}, { page, pageSize });

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data,
  });
});

exports.paginate = async (query, options) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return await Announcements.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

exports.remove = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.body || {};
  const removed = await this.deleteOne({ _id: id });

  if (removed?.deletedCount) {
    return res.json({
      id,
      success: true,
      message: "Announcement deleted successfully",
    });
  }

  return res.json({
    success: false,
    message: "Announcement not found",
  });
});

exports.removeAll = catchAsyncErrors(async (req, res, next) => {
  const removed = await this.deleteMany({});

  if (removed?.deletedCount) {
    return res.json({
      success: true,
    });
  }
  return res.json({
    success: false,
  });
});

exports.countDocuments = async (query) => {
  return await Announcements.countDocuments(query);
};

exports.save = async (query) => {
  const announcement = new Announcements(query);
  return await announcement.save();
};

exports.update = async (notificationId, payload) => {
  return await Announcements.findByIdAndUpdate(notificationId, payload);
};

exports.updateMany = async (userId, payload) => {
  return await Announcements.updateMany(userId, payload);
};

exports.deleteMany = async (query) => {
  return await Announcements.deleteMany(query);
};
exports.find = async (query) => {
  return await Announcements.find(query);
};

exports.findOne = async (query) => {
  return await Announcements.findOne(query);
};

exports.deleteOne = async (query) => {
  return await Announcements.deleteOne(query);
};
