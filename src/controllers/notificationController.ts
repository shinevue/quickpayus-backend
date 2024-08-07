import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import notificationService from '../services/notificationService';
import { Request, Response, NextFunction } from 'express';
// import { ErrorHandler } from "../utils/errorHandler"; // Assuming ErrorHandler is used somewhere

interface User {
  username: string;
  id: string;
}

export const get = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { page = '1', isRead = 'false' } = req.query;
    const pageSize = parseInt(process.env.RECORDS_PER_PAGE || '15', 10);
    const { username, id } = req.user || {};

    const query = {
      $or: [
        {
          adminCreated: false,
          userId: username,
          // action: {
          //   $elemMatch: {
          //     isRead: isRead === 'true',
          //   },
          // },
        },
        {
          adminCreated: false,
          userId: id,
          // action: {
          //   $elemMatch: {
          //     isRead: isRead === 'true',
          //   },
          // },
        },
        {
          adminCreated: true,
          action: {
            $not: {
              $elemMatch: {
                username: username,
                isDelete: true,
              },
            },
          },
        },
      ],
    };

    const total = await notificationService.countDocuments(query);
    console.log(total);

    // if (isRead === 'false') {
    //   return res.json({
    //     success: true,
    //     total,
    //   });
    // }

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
      data: data.map((item) => {
        let isRead: boolean | undefined = false;
        if (item.action)
          item?.action.map((info) => {
            if (info.username === req.user.username) isRead = info.isRead;
          });
        const res: any = {
          ...item,
        };

        return { ...res?._doc, isRead };
      }),
    });
  },
);

export const updateMany = catchAsyncErrors(async (req: any, res: Response) => {
  const { id, username } = req.user as User;

  await notificationService.updateMany(id, {
    $or: [
      { userId: username, isRead: false },
      { adminCreated: true },
      { userId: id, isRead: false },
    ],
  });

  return res.json({
    success: true,
  });
});

export const deleteMany = catchAsyncErrors(async (req: any, res: Response) => {
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
});

export const updateRead = catchAsyncErrors(async (req: any, res: Response) => {
  const { id } = req.params;
  const { username } = req.user;

  await notificationService.updateReadOne(id, username);

  return res.json({
    success: true,
  });
});

export const deleteOne = catchAsyncErrors(async (req: any, res: Response) => {
  const { username } = req.user;
  const { id } = req.params;

  await notificationService.deleteOne(id, username);

  return res.json({
    success: true,
  });
});
