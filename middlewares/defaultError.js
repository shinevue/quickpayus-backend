const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  // wrong mongodb Id error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 401);
  }
  //mongoose duplicate key error
  if (err.code === 11000) {
    const message = `${Object.keys(
      err.keyValue
    )} already exist. Please choose another username.`;
    err = new ErrorHandler(message, 401);
  }

  //Wrong JWT Token error
  if (err.name === "JSONWebTokenError") {
    const message = `Json Web Token is Invalid, Try again`;
    err = new ErrorHandler(message, 401);
  }

  // JWT Expire error
  if (err.name === "TokenExpiredError") {
    const message = `Json Web Token is Expired, Try again`;
    err = new ErrorHandler(message, 401);
  }
  res.status(err.statusCode).json({ success: false, message: err.message });
};
