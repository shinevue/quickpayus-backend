import { Request, Response, NextFunction } from 'express';
import config from '../../config/constants';
import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import Roles, { IRole } from '../../models/roleModel'; // Adjust the import based on your Role model
import ErrorHandler from '../../utils/errorHandler';

export const create = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const newRole = new Roles({
      roleName: req.body.roleName,
      permissions: req.body.permissions,
    });

    try {
      const role: IRole = await newRole.save();
      res.json({
        success: true,
        msg: 'Role created successfully:',
        role,
      });
    } catch (error) {
      res.json({
        success: false,
        msg: error,
      });
    }
  },
);

export const get = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { page = 1 } = req.query as { page?: number };
    const pageSize = Number(process.env.RECORDS_PER_PAGE) || 15;

    const total = await countDocuments({});
    if (!total) {
      return next(new ErrorHandler('No Roles found', 404));
    }

    const data = await paginate({}, { page, pageSize });
    return res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / pageSize),
      data,
    });
  },
);

export const paginate = async (
  query: any,
  options: { page: number; pageSize: number },
) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return await Roles.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

export const updateRole = async (req: Request, res: Response) => {
  const id = req.params.id;
  const data = req.body;

  try {
    await Roles.findByIdAndUpdate(id, data);
    res.status(201).json({ msg: 'Updated successfully.' });
  } catch {
    res.status(500).json({ msg: "Can't update role" });
  }
};

export const remove = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const deleted = await deleteOne({ _id: id });

    if (deleted?.deletedCount) {
      return res.json({
        id,
        success: true,
        message: 'Role deleted successfully',
      });
    }

    return res.json({
      success: false,
      message: 'Role not found',
    });
  },
);

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

export const getPermission = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    if (req.user.role === 'admin') {
      return res.send({
        success: true,
        data: config.ALLOWED_ROUTES.map((item) => item.TITLE),
      });
    }

    const role = await Roles.findOne({
      roleName: req.user.role,
    });

    if (role) {
      return res.send({
        success: true,
        data: role.permissions,
      });
    }

    return next(new ErrorHandler('Permission not found', 400));
  },
);

export const countDocuments = async (query: any): Promise<number> => {
  return await Roles.countDocuments(query);
};

export const save = async (query: any): Promise<IRole> => {
  const role = new Roles(query);
  return await role.save();
};

export const update = async (
  roleId: string,
  payload: any,
): Promise<IRole | null> => {
  return await Roles.findByIdAndUpdate(roleId, payload, { new: true });
};

export const updateMany = async (query: any, payload: any) => {
  return await Roles.updateMany(query, payload);
};

export const deleteMany = async (query: any) => {
  return await Roles.deleteMany(query);
};

export const find = async (query: any): Promise<IRole[]> => {
  return await Roles.find(query);
};

export const findOne = async (query: any): Promise<IRole | null> => {
  return await Roles.findOne(query);
};

export const deleteOne = async (query: any) => {
  return await Roles.deleteOne(query);
};
