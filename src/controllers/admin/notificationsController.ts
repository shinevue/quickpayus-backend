import catchAsyncErrors from "../../middlewares/catchAsyncErrors";
import { Notification } from "../../models/notificationModel";
import notificationService from "../../services/notificationService";
import ErrorHandler from "../../utils/errorHandler";
import { Request, Response, NextFunction } from "express";

export const create = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body) {
    return next(new ErrorHandler("No request body found"));
  }

  const alreadyExist = await notificationService.findOne({
    title: req.body.title,
  });

  if (alreadyExist) {
    return next(new ErrorHandler(`Notification already exists with title: ${req.body.title}`));
  }

  const data = await notificationService.create({
    ...req.body,
    userId: req.user.username,
  });

  return res.json({
    success: true,
    message: "Notification created successfully",
    data,
  });
});

export const get = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1 } = req.query as { page?: number };
  const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;
  const total = await notificationService.countDocuments({
    adminCreated: true,
  });

  if (!total) {
    return next(new ErrorHandler("No announcements found"));
  }

  const data = await notificationService.paginateQuery(
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

export const remove = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const removed = await deleteOne({ _id: id });

  if (removed?.deletedCount) {
    return res.json({
      id,
      success: true,
      message: "Notification deleted successfully",
    });
  }

  return res.json({
    success: false,
    message: "Notification not found",
  });
});

export const removeAll = catchAsyncErrors(async (req: Request, res: Response) => {
  // Implementation for removing all notifications can be added here
});

export const deleteOne = async (query: any) => {
  return await Notification.deleteOne(query);
};