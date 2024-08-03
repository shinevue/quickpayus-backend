const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const url = require('url');
const { ALLOWED_ROUTES } = require("../config/constants");
const Role = require("../models/roleModel");
const { ObjectId } = require("mongodb");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {

  const { token } = req.headers;
  if (!token) {
    return next(
      new ErrorHandler(
        "Please login to access this resource. Token not found",
        401
      )
    );
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const userFound = await User.findById(decodedData.id);

  if (!userFound) {
    return next(new ErrorHandler("Please login to access this resource.", 401));
  }
  req.user = userFound;

  next();
});

/**
 * 1. Customers of this site
 * 2. Not signed role
 * 3. Check the allowed Route // able to add info constants.js file
 */
exports.authorizeRole = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;

  // Check if the user role is "user" and return an error if so
  if (role === "user") {
    return next(new ErrorHandler("You are not authorized to access this resource.", 403));
  }

  if (role === "admin") {
    return next();
  }

  const roleData = await Role.findOne({
    roleName: role
  });

  // Return an error if role data is not found
  if (!roleData) {
    // await User.findByIdAndUpdate(new ObjectId(req.user.id), { role: "user" });
    return next(new ErrorHandler("Your role was removed.", 401));
  }

  let isPrivatePath = false;
  let isAllowed = false;
  const current = {
    METHOD: req.method,
    PATH: url.parse(req.originalUrl).pathname
  }
  ALLOWED_ROUTES.forEach(routeGroup => {
    routeGroup.ROUTE.forEach(route => {
      if (!isPrivatePath && current.PATH.includes(route.PATH) && current.METHOD === route.METHOD) isPrivatePath = true;

      if (roleData.permissions.includes(routeGroup.TITLE)) {
        if (current.PATH.includes(route.PATH) && current.METHOD === route.METHOD) isAllowed = true;
      }
    });
  });

  // Return an error if the path is private and user is not allowed
  if (isPrivatePath && !isAllowed) {
    return next(new ErrorHandler("You are not authorized to access this resource.", 401));
  }

  next();
});
