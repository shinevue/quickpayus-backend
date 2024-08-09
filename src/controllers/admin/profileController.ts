import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import User, { IUser } from '../../models/userModel'; // Adjust the import based on your User model
import ErrorHandler from '../../utils/errorHandler';
import { Request, Response, NextFunction } from 'express';

export const create = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const referralId = req.user.id;
    const primaryColorsList = [
      '#007AFF',
      '#34C759',
      '#FF3B30',
      '#FFCC00',
      '#FF9500',
      '#00C7BE',
      '#FF2D55',
      '#AF52DE',
      '#5856D6',
    ];
    const secondaryColorsList = [
      '#D5E4F4',
      '#E7F8EB',
      '#FFE7E6',
      '#FFF9E0',
      '#FFF2E0',
      '#E0F8F7',
      '#FFE6EB',
      '#F5EAFB',
      '#EBEBFA',
    ];

    const randomIndex = Math.floor(Math.random() * primaryColorsList.length);
    const userInfo = req.body;

    const updateInfo = {
      ...userInfo,
      firstName: 'Admin',
      lastName: 'Clone',
      termsAndConditions: true,
    };

    const user = new User({
      ...updateInfo,
      avatarBg: `linear-gradient(180deg, ${primaryColorsList[randomIndex]} 0%, ${secondaryColorsList[randomIndex]} 150%)`,
      referralId,
    });

    try {
      const result = await user.save();
      res.json({ success: true, message: 'User Created', data: result });
    } catch (e) {
      res.json({ success: false, message: 'User Create failed', error: e });
    }
  },
);

export const edit = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const userID = req.params.id;
    const userInfo = req.body;

    const user: any = await User.findById(userID);

    user.password = userInfo.password;
    user.username = userInfo.username;
    user.email = userInfo.email;
    user.phoneNumber = userInfo.phoneNumber;
    user.role = userInfo.role;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  },
);

export const getAllUser = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { page = 1 } = req.query as { page?: number };
    const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;
    const total = await countDocuments({});

    if (!total) {
      return next(new ErrorHandler('No User found', 404));
    }

    const data = await paginate({ role: { $ne: 'user' } }, { page, pageSize });

    return res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: data.filter((user: IUser) => user.username !== req.user.username),
    });
  },
);

export const remove = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const deleted = await deleteOne({ _id: id });

    if (deleted?.deletedCount) {
      return res.json({
        id,
        success: true,
        message: 'User deleted successfully',
      });
    }

    return res.json({
      success: false,
      message: 'User not found',
    });
  },
);

export const paginate = async (
  query: any,
  options: { page: number; pageSize: number },
) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return await User.find(query)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(pageSize);
};

export const countDocuments = async (query: any) => {
  return await User.countDocuments(query);
};

export const deleteOne = async (query: any) => {
  return await User.deleteOne(query);
};

const profileCtrl = {
  create,
  edit,
  getAllUser,
  remove,
  paginate,
  countDocuments,
  deleteOne,
};

export default profileCtrl;
