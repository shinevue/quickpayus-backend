import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import {
  countDocuments,
  paginateQuery,
  deleteMany,
  update,
  deleteOne,
} from '../services/notificationService';
import { Request, Response, NextFunction } from 'express';
// import { ErrorHandler } from "../utils/errorHandler"; // Assuming ErrorHandler is used somewhere

interface User {
  username: string;
  id: string;
}

interface GetNotificationsRequest extends Request {
  user: User;
  query: {
    page?: string;
    isRead?: string;
  };
}

interface UpdateReadRequest extends Request {
  params: {
    id: string;
  };
}

interface DeleteOneRequest extends Request {
  params: {
    id: string;
  };
}

export const get = catchAsyncErrors(
  async (req: GetNotificationsRequest, res: Response, next: NextFunction) => {
    const { page = '1', isRead = 'false' } = req.query;
    const pageSize = parseInt(process.env.RECORDS_PER_PAGE || '15', 10);
    const { username, id } = req.user || {};

    const query = {
      $or: [
        { userId: username, isRead: isRead === 'true' },
        { adminCreated: true },
        { userId: id, isRead: isRead === 'true' },
      ],
    };

    const total = await notificationService.countDocuments(query);
    console.log(total);

    if (isRead === 'false') {
      return res.json({
        success: true,
        total,
      });
    }

    if (!total) {
      return res.json({
        success: false,
        message: 'No notifications found',
        total,
      });
    }

    const data = await notificationService.paginateQuery(query, {
      page: parseInt(page, 10),
      pageSize,
    });

    return res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / pageSize),
      data,
    });
  },
);

export const updateMany = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const { id, username } = req.user as User;

    await notificationService.updateMany(
      {
        $or: [
          { userId: username, isRead: false },
          { adminCreated: true },
          { userId: id, isRead: false },
        ],
      },
      { isRead: true },
    );

    return res.json({
      success: true,
    });
  },
);

export const deleteMany = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const { id, username } = req.user as User;

    await notificationService.deleteMany({
      $or: [
        { userId: username, isRead: false },
        { adminCreated: true },
        { userId: id, isRead: false },
      ],
    });

    return res.json({
      success: true,
    });
  },
);

export const updateRead = catchAsyncErrors(
  async (req: UpdateReadRequest, res: Response) => {
    const { id } = req.params;

    await notificationService.update(id, { isRead: true });

    return res.json({
      success: true,
    });
  },
);

export const deleteOne = catchAsyncErrors(
  async (req: DeleteOneRequest, res: Response) => {
    const { id } = req.params;

    await notificationService.deleteOne(id);

    return res.json({
      success: true,
    });
  },
);
