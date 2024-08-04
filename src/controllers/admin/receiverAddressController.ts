import config from '../../config/config';
import ErrorHandler from '../../utils/errorHandler';
import catchAsyncErrors from '../../middlewares/catchAsyncErrors';

import Receiver from '../../models/receiverAddressModel';
import { isValidAddress } from '../../utils/trc20Validator';
import { create } from '../../services/notificationService';

import configConstants from '../../config/constants';

export const getAllReceiver = catchAsyncErrors(async (req, res, next) => {
  const data = await Receiver.find({}).sort({ createdAt: -1 });

  if (!data?.length) {
    return res.json({
      success: false,
      data: [],
    });
  }

  return res.json({
    success: true,
    data,
  });
});

export const addReceiver = catchAsyncErrors(async (req, res, next) => {
  const { username } = req.user;
  const newReceiver = new Receiver({ ...req.body, adminId: username });

  if (isValidAddress(req.body.newAddress))
    newReceiver
      .save()
      .then((receiver) => {
        create({
          userId: username,
          title: 'RECEIVER ADDRESS CHANGE',
          type: configConstants.NOTIFICATION_TYPES.ACTIVITY,
          message: `Receiver address changed to ${req.body.newAddress}`,
          adminCreated: true,
        });
        res.json({
          success: true,
          msg: 'Receiver created successfully:',
          receiver: receiver,
        });
      })
      .catch((error) => {
        res.json({
          success: false,
          msg: error,
        });
      });
  else {
    res.json({
      success: false,
      msg: 'Address validation failed.',
    });
  }
});

export const defaultReceiver = catchAsyncErrors(async (req, res, next) => {
  const count = await Receiver.find();
  if (count.length) {
    console.log("--- Can't create Admin Receiver address ---");
    return;
  }
  const adminAddress = config.adminAddress;

  const newReceiver = new Receiver(adminAddress);
  newReceiver
    .save()
    .then(() => {
      console.log('--- Admin Receiver address created successfully ---');
    })
    .catch(() => {
      console.log("--- Can't create Admin Receiver address ---");
    });
});
