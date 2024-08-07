import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import { Announcements } from '../models/announcementModel';
import ErrorHandler from '../utils/errorHandler';
import { Request, Response, NextFunction } from 'express';

interface GetAnnouncementsRequest extends Request {
  query: {
    page?: string;
  };
}

interface RemoveAnnouncementRequest extends Request {
  body: {
    id: string;
  };
}

interface PaginateOptions {
  page: number;
  pageSize: number;
}

export const create = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    if (!req.body) {
      return next(new ErrorHandler('No request body found', 404));
    }

    const alreadyExist = await findOne({ title: req.body.title });
    if (alreadyExist) {
      return next(
        new ErrorHandler(
          `Announcement already exists with title: ${req.body.title}`,
          403,
        ),
      );
    }

    const data = await save({ ...req.body, userId: req.user.username });
    return res.json({
      success: true,
      message: 'Announcement created successfully',
      data,
    });
  },
);

export const get = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { page = '1' } = req.query || {};
    const pageSize = parseInt(process.env.RECORDS_PER_PAGE || '15', 10);
    const { username, id } = req.user;

    const query = {
      action: {
        $not: {
          $elemMatch: {
            username: username,
            isDelete: true,
          },
        },
      },
    };

    const total = await countDocuments(query);

    if (!total) {
      return next(new ErrorHandler('No Announcements found', 404));
    }

    const data = await paginate(query, { page: parseInt(page, 10), pageSize });

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

export const paginate = async (query: object, options: PaginateOptions) => {
  const { page, pageSize } = options || { page: 1, pageSize: 15 };
  const skip = (page - 1) * pageSize;

  return await Announcements.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

export const remove = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { username } = req.user;

    await deleteOne(id, username);

    return res.json({
      success: true,
    });
  },
);

export const readOne = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { username } = req.user;

    await updateOne(id, username);

    return res.json({
      success: true,
    });
  },
);

const deleteOne = async (id: string, username: string): Promise<any> => {
  const announcement = await Announcements.findById(id);

  if (announcement && announcement?.action) {
    const userInfo = announcement.action.find(
      (user) => user.username === username,
    );

    if (userInfo) {
      userInfo.isDelete = true;
      announcement.action = announcement.action.map((user) => {
        if (user.username === username) return userInfo;
        else return user;
      });
    } else {
      announcement?.action?.push({
        username: username,
        isDelete: true,
      });
    }
  } else {
    announcement?.action?.push({
      username: username,
      isDelete: true,
    });
  }
  announcement?.save();
  return announcement;
};

const updateOne = async (id: string, username: string): Promise<any> => {
  const announcements = await Announcements.findById(id);

  if (announcements && announcements?.action) {
    const userInfo = announcements.action.find(
      (user) => user.username === username,
    );

    if (userInfo) {
      userInfo.isRead = true;
      announcements.action = announcements.action.map((user) => {
        if (user.username === username) return userInfo;
        else return user;
      });
    } else {
      announcements?.action?.push({
        username: username,
        isRead: true,
      });
    }
  } else {
    announcements?.action?.push({
      username: username,
      isRead: true,
    });
  }
  announcements?.save();
  return announcements;
};

export const removeAll = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const removed = await deleteMany({});

    if (removed?.deletedCount) {
      return res.json({
        success: true,
      });
    }

    return res.json({
      success: false,
    });
  },
);

export const countDocuments = async (query: object) => {
  return await Announcements.countDocuments(query);
};

export const save = async (query: object) => {
  const announcement = new Announcements(query);
  return await announcement.save();
};

export const update = async (announcementsId: string, payload: object) => {
  return await Announcements.findByIdAndUpdate(announcementsId, payload);
};

export const updateMany = async (userId: string, payload: object) => {
  return await Announcements.updateMany({ userId }, payload);
};

export const deleteMany = async (query: object) => {
  return await Announcements.deleteMany(query);
};

export const find = async (query: object) => {
  return await Announcements.find(query);
};

export const findOne = async (query: object) => {
  return await Announcements.findOne(query);
};
