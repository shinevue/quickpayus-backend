import { Notification } from '../../models/notificationModel';

interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export const paginate = async (userId: string, options?: PaginationOptions) => {
  const { page = 1, pageSize = 10 } = options || {}; // Default to page 1 and page size 10
  const skip = (page - 1) * pageSize;

  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

export const countDocuments = async (
  query: Record<string, any>,
): Promise<number> => {
  return await Notification.countDocuments(query);
};

export const create = async (
  payload: Record<string, any>,
): Promise<Notification> => {
  const notification = new Notification(payload);
  return await notification.save();
};

export const update = async (
  notificationId: string,
  payload: Record<string, any>,
): Promise<Notification | null> => {
  return await Notification.findByIdAndUpdate(notificationId, payload, {
    new: true,
  }); // Return the updated document
};

export const updateMany = async (
  userId: string,
  payload: Record<string, any>,
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany({ userId }, payload); // Ensure to use a query object
};

export const find = async (
  query: Record<string, any>,
): Promise<Notification[]> => {
  return await Notification.find(query);
};

export const findOne = async (
  query: Record<string, any>,
): Promise<Notification | null> => {
  return await Notification.findOne(query);
};
