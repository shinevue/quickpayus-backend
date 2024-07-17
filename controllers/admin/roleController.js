const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { Roles } = require("../models/roleModel");
const ErrorHandler = require("../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res, next) => {
  if (!req?.body) {
    return next(new ErrorHandler("No request body found"));
  }

  const alreadyExist = await this.findOne({ roleName: req?.body?.roleName });

  if (alreadyExist)
    return next(
      new ErrorHandler(`Role already exist with this: ${req.body.roleName}`)
    );

  const data = await this.save({ ...req?.body });

  return res.json({
    success: true,
    message: "Role created successfully",
    data,
  });
});

exports.get = catchAsyncErrors(async (req, res, next) => {
  const { page = 1 } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const total = await this.countDocuments({});

  if (!total) {
    return next(new ErrorHandler("No Roles found"));
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
  return await Roles.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

exports.update = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.params || {};
  const updated = await this.update({ _id: id, payload: req.body });

  if (updated?.updatedCount) {
    return res.json({
      id,
      success: true,
      message: "Role updated successfully",
    });
  }

  return res.json({
    success: false,
    message: "Role not found",
  });
});

exports.remove = catchAsyncErrors(async (req, res, next) => {
  const { id } = req?.body || {};
  const updated = await this.deleteOne({ _id: id });

  if (updated?.deletedCount) {
    return res.json({
      id,
      success: true,
      message: "Role deleted successfully",
    });
  }

  return res.json({
    success: false,
    message: "Role not found",
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
  return await Roles.countDocuments(query);
};

exports.save = async (query) => {
  const role = new Roles(query);
  return await role.save();
};

exports.update = async (roomId, payload) => {
  return await Roles.findByIdAndUpdate(roomId, payload);
};

exports.updateMany = async (userId, payload) => {
  return await Roles.updateMany(userId, payload);
};

exports.deleteMany = async (query) => {
  return await Roles.deleteMany(query);
};
exports.find = async (query) => {
  return await Roles.find(query);
};

exports.findOne = async (query) => {
  return await Roles.findOne(query);
};

exports.deleteOne = async (query) => {
  return await Roles.deleteOne(query);
};
