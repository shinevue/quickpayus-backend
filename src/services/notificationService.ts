import { Notification } from '../models/notificationModel';

// Define the types for the options parameter
interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

interface Payload {
  // Define the structure of the payload as needed
  // For example:
  title: string;
  message: string;
  userId?: string;
  createdAt?: Date;
  type?: string;
  adminCreated?: boolean;
  // Add other fields according to your Notification model
}

export const paginate = async (
  userId: string,
  options?: PaginationOptions,
): Promise<Payload[]> => {
  const { page = 1, pageSize = 10 } = options || {};
  const skip = (page - 1) * pageSize;

  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

export const paginateQuery = async (
  query: Record<string, any>,
  options?: PaginationOptions,
): Promise<Payload[]> => {
  const { page = 1, pageSize = 10 } = options || {};
  const skip = (page - 1) * pageSize;

  return await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

export const countDocuments = async (
  query: Record<string, any>,
): Promise<number> => {
  return await Notification.countDocuments(query);
  
};
export const create = async (payload: Payload): Promise<Payload> => {
  const notification = new Notification(payload);
  return await notification.save();
};

export const update = async (
  notificationId: string,
  payload: Payload,
): Promise<Payload | null> => {
  return await Notification.findByIdAndUpdate(notificationId, payload, {
    new: true,
  });
};

export const updateMany = async (
  userId: string,
  payload: Payload,
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany({ userId }, payload);
};

export const deleteMany = async (
  query: Record<string, any>,
): Promise<{ deletedCount?: number }> => {
  return await Notification.deleteMany(query);
};

export const find = async (query: Record<string, any>): Promise<Payload[]> => {
  return await Notification.find(query);
};

export const findOne = async (
  query: Record<string, any>,
): Promise<Payload | null> => {
  return await Notification.findOne(query);
};

export const deleteOne = async (id: string): Promise<Payload | null> => {
  return await Notification.findByIdAndDelete(id);
};
