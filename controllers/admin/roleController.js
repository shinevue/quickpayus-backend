const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const Roles = require("../../models/roleModel");
const ErrorHandler = require("../../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res, next) => {
  const newRole = new Roles({
    roleName: req.body.roleName,
    permissions: req.body.permissions,
  });

  newRole
    .save()
    .then((role) => {
      res.json({
        success: true,
        msg: "Role created successfully:",
        role: role,
      });
    })
    .catch((error) => {
      res.json({
        success: false,
        msg: error,
      });
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

exports.updateRole = (req, res) => {
  let id = req.params.id;
  let data = req.body;
  Roles.findByIdAndUpdate(id, data)
    .then(() => {
      res.status(201).json({ msg: "Updated successfully." });
    })
    .catch(() => {
      res.status(500).json({ msg: "Can't update role" });
    });
};

exports.remove = catchAsyncErrors(async (req, res, next) => {
  let id = req.params.id;

  const deleted = await this.deleteOne({ _id: id });

  if (deleted?.deletedCount) {
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
