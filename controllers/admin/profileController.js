const catchAsyncErrors = require("../../middlewares/catchAsyncErrors");
const User = require("../../models/userModel");
const ErrorHandler = require("../../utils/errorHandler");

exports.create = catchAsyncErrors(async (req, res, next) => {
  const primaryColorsList = [
    "#007AFF",
    "#34C759",
    "#FF3B30",
    "#FFCC00",
    "#FF9500",
    "#00C7BE",
    "#FF2D55",
    "#AF52DE",
    "#5856D6",
  ];
  const secondaryColorsList = [
    "#D5E4F4",
    "#E7F8EB",
    "#FFE7E6",
    "#FFF9E0",
    "#FFF2E0",
    "#E0F8F7",
    "#FFE6EB",
    "#F5EAFB",
    "#EBEBFA",
  ];
  const randomIndex = Math.floor(Math.random() * primaryColorsList.length);

  const userInfo = req.body;

  const updateInfo = {
    ...userInfo,
    firstName: "Admin",
    lastName: "Clone",
    termsAndConditions: true,
  };

  const user = new User({
    ...updateInfo,
    avatarBg: `linear-gradient(180deg, ${primaryColorsList[randomIndex]} 0%, ${secondaryColorsList[randomIndex]} 150%)`,
  });

  const saved = await user
    .save()
    .then((result) => {
      res.json({ success: true, message: "User Created", data: result });
    })
    .catch((e) => {
      res.json({ success: false, message: "User Create failed", error: e });
    });
});

exports.edit = catchAsyncErrors(async (req, res, next) => {
  const userID = req.params.id;

  const userInfo = req.body;

  const updateInfo = {
    ...userInfo,
    firstName: "Admin",
    lastName: "Clone",
    termsAndConditions: true,
  };

  const user = await User.findByIdAndUpdate(userID, updateInfo);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const { page = 1 } = req?.query || {};

  const pageSize = process.env.RECORDS_PER_PAGE || 15;

  const total = await this.countDocuments({});

  if (!total) {
    return next(new ErrorHandler("No User found"));
  }

  const data = await this.paginate(
    { firstName: "Admin", lastName: "Clone" },
    { page, pageSize }
  );

  return res.json({
    success: true,
    total,
    totalPages: Math.ceil(total / pageSize),
    data: data.filter((user) => user.username !== req.user.username),
  });
});

exports.remove = catchAsyncErrors(async (req, res, next) => {
  let id = req.params.id;
  console.log(id);
  const deleted = await this.deleteOne({ _id: id });

  if (deleted?.deletedCount) {
    return res.json({
      id,
      success: true,
      message: "User deleted successfully",
    });
  }

  return res.json({
    success: false,
    message: "User not found",
  });
});

exports.paginate = async (query, options) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return await User.find(query)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(pageSize);
};

exports.countDocuments = async (query) => {
  return await User.countDocuments(query);
};

exports.deleteOne = async (query) => {
  return await User.deleteOne(query);
};
