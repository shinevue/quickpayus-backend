import { Request, Response, NextFunction } from 'express';
import ErrorHandler from '../../utils/errorHandler';
import catchAsyncErrors from '../../middlewares/catchAsyncErrors';
import ProfitConfig, { IProfitConfig } from '../../models/profitConfigModel'; // Adjust the import based on your ProfitConfig model
import config from '../../config/config';
// import programCtlr from '../programController'; // Assuming this is needed; adjust as necessary
// import HELPER from '../../helpers'; // Assuming this is needed; adjust as necessary

export const get = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profitConfigs: IProfitConfig[] =
        (await ProfitConfig.find({}).sort({ createdAt: -1 }).exec()) || [];

      if (!profitConfigs.length) {
        return res.json({
          success: false,
          data: [],
        });
      }

      const profit = profitConfigs[0]?.profit || {};
      return res.json({
        success: true,
        data: profit,
        history: profitConfigs,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export const upsert = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { username } = req.user;
    const { profit } = req.body || {};

    const _profitConfig = new ProfitConfig({ userId: username, profit });

    try {
      const response: IProfitConfig = await _profitConfig.save();

      return res.json({
        success: true,
        message: 'Profit config upserted successfully',
        data: response,
      });
    } catch (error) {
      return next(
        new ErrorHandler('Something went wrong updating profit config!', 403),
      );
    }
  },
);

export const defaultProfitConfig = async () => {
  const count = await ProfitConfig.find();
  if (count.length) {
    console.log("--- Can't create Admin ProfitConfig address ---");
    return;
  }
  const adminAddress = config.profitConfig;

  const newProfitConfig = new ProfitConfig(adminAddress);
  newProfitConfig
    .save()
    .then(() => {
      console.log('--- Admin ProfitConfig address created successfully ---');
    })
    .catch(() => {
      console.log("--- Can't create Admin ProfitConfig address ---");
    });
};

