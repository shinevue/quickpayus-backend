import { ObjectId } from 'mongoose';
import { ActionType, Notification } from '../models/notificationModel';

// Define the types for the options parameter
interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

interface Payload {
  title?: string;
  message?: string;
  userId?: string | ObjectId;
  createdAt?: Date;
  type?: string;
  adminCreated?: boolean;
  link?: string;
  isRead?: boolean;
  action?: ActionType[];
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

const updateReadMany = async (username: string, query: any): Promise<any> => {
  // Update all notifications where the action array contains the username
  const result = await Notification.updateMany(
    query, // Filter: notifications containing the username in the action array
    { $push: { action: { isRead: true, username: username } } }, // Update: set the isRead field to true for the matched element
    {
      arrayFilters: [{ 'elem.username': username }], // Specify which elements to update in the array
      new: true,
    },
  );

  return result; // Optionally return the result of the update operation
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

const deleteOne = async (id: string, username: string): Promise<any> => {
  const notification = await Notification.findById(id);
  if (!notification?.adminCreated)
    return await Notification.findByIdAndDelete(id);

  if (notification && notification?.action) {
    const userInfo = notification.action.find(
      (user) => user.username === username,
    );

    if (userInfo) {
      userInfo.isDelete = true;
      notification.action = notification.action.map((user) => {
        if (user.username === username) return userInfo;
        else return user;
      });
    } else {
      notification?.action?.push({
        username: username,
        isDelete: true,
      });
    }
  } else {
    notification?.action?.push({
      username: username,
      isDelete: true,
    });
  }
  notification?.save();
  return notification;
};

const updateReadOne = async (id: string, username: string): Promise<any> => {
  const notification = await Notification.findById(id);

  if (notification && notification?.action) {
    const userInfo = notification.action.find(
      (user) => user.username === username,
    );

    if (userInfo) {
      userInfo.isRead = true;
      notification.action = notification.action.map((user) => {
        if (user.username === username) return userInfo;
        else return user;
      });
    } else {
      notification?.action?.push({
        username: username,
        isRead: true,
      });
    }
  } else {
    notification?.action?.push({
      username: username,
      isRead: true,
    });
  }
  notification?.save();
  return notification;
};

const notificationService = {
  paginate,
  paginateQuery,
  countDocuments,
  create,
  update,
  updateReadMany,
  deleteMany,
  find,
  findOne,
  deleteOne,
  updateReadOne,
};

export default notificationService;
