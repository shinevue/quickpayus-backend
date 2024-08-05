import { ObjectId } from 'mongoose';
import { Notification } from '../models/notificationModel';

// Define the types for the options parameter
interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

interface Payload {
  // Define the structure of the payload as needed
  // For example:
  title?: string;
  message?: string;
  userId?: string | ObjectId;
  createdAt?: Date;
  type?: string;
  adminCreated?: boolean;
  link?: string;
  isRead?: boolean;
  // Add other fields according to your Notification model
}

const paginate = async (
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

const paginateQuery = async (
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

const countDocuments = async (query: Record<string, any>): Promise<number> => {
  return await Notification.countDocuments(query);
};
const create = async (payload: Payload): Promise<Payload> => {
  const notification = new Notification(payload);
  return await notification.save();
};

const update = async (
  notificationId: string,
  payload: Payload,
): Promise<Payload | null> => {
  return await Notification.findByIdAndUpdate(notificationId, payload, {
    new: true,
  });
};

const updateMany = async (
  userId: string,
  payload: Payload,
): Promise<{ modifiedCount: number }> => {
  return await Notification.updateMany({ userId }, payload);
};

const deleteMany = async (
  query: Record<string, any>,
): Promise<{ deletedCount?: number }> => {
  return await Notification.deleteMany(query);
};

const find = async (query: Record<string, any>): Promise<Payload[]> => {
  return await Notification.find(query);
};

const findOne = async (query: Record<string, any>): Promise<Payload | null> => {
  return await Notification.findOne(query);
};

const deleteOne = async (id: string): Promise<any> => {
  return await Notification.findByIdAndDelete(id);
};

const notificationService = {
  paginate,
  paginateQuery,
  countDocuments,
  create,
  update,
  updateMany,
  deleteMany,
  find,
  findOne,
  deleteOne,
};

export default notificationService;
