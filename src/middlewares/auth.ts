import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";
import ErrorHandler from "../utils/errorHandler";
import catchAsyncErrors from "./catchAsyncErrors";
import jwt from "jsonwebtoken";
import url from 'url';
import config from "../config/constants";
import Role from "../models/roleModel";

interface DecodedData {
  id: string;
}

interface RoleData {
  roleName: string;
  permissions: string[];
}

export const isAuthenticatedUser = catchAsyncErrors(async (req: any, res: Response, next: NextFunction) => {
  const { token } = req.headers;

  if (!token) {
    return next(
      new ErrorHandler(
        "Please login to access this resource. Token not found",
        401
      )
    );
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET!) as DecodedData;
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
export const authorizeRole = catchAsyncErrors(async (req: any, res: Response, next: NextFunction) => {
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
  }) as RoleData;

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
  };

  config.ALLOWED_ROUTES.forEach(routeGroup => {
    routeGroup.ROUTE.forEach(route => {
      if (!isPrivatePath && current.PATH?.includes(route.PATH) && current.METHOD === route.METHOD) {
        isPrivatePath = true;
      }
      if (roleData.permissions.includes(routeGroup.TITLE)) {
        if (current.PATH?.includes(route.PATH) && current.METHOD === route.METHOD) {
          isAllowed = true;
        }
      }
    });
  });

  // Return an error if the path is private and user is not allowed
  if (isPrivatePath && !isAllowed) {
    return next(new ErrorHandler("You are not authorized to access this resource.", 401));
  }

  next();
});