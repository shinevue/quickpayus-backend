const { Notification } = require("../models/notificationModel");

exports.paginate = async (userId, options) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

exports.paginateQuery = async (query, options) => {
  const { page, pageSize } = options || {};
  const skip = (page - 1) * pageSize;
  return await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(pageSize);
};

exports.countDocuments = async (query) => {
  return await Notification.countDocuments(query);
};

exports.create = async (payload) => {
  const notification = new Notification(payload);
  return await notification.save();
};

exports.update = async (notificationId, payload) => {
  return await Notification.findByIdAndUpdate(notificationId, payload);
};

exports.updateMany = async (userId, payload) => {
  return await Notification.updateMany(userId, payload);
};

exports.find = async (query) => {
  return await Notification.find(query);
};

exports.findOne = async (query) => {
  return await Notification.findOne(query);
};
