import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import FeedBack from '../models/feedbackModel';
import Ticket from '../models/ticketModel';
import User from '../models/userModel';
import fs from 'fs';
import path from 'path';
import notificationService from '../services/notificationService';
import config from '../config/constants';
import { Request, Response, NextFunction } from 'express';

// interface FeedbackRequest extends Request {
//   body: {
//     feedback: string;
//     rating: number;
//   };
//   user: {
//     id: string;
//   };
//   file?: {
//     filename: string;
//     mimetype: string;
//   };
// }

// interface TicketRequest extends Request {
//   body: {
//     priority: string;
//     subject: string;
//     description: string;
//   };
//   user: {
//     id: string;
//   };
//   file?: {
//     filename: string;
//     mimetype: string;
//   };
// }

interface GetFeedbackRequest extends Request {
  query: {
    page?: string;
    pageSize?: string;
    keyword?: string;
    dateRange?: string[];
  };
}

interface GetTicketRequest extends Request {
  query: {
    page?: string;
    pageSize?: string;
    keyword?: string;
    dateRange?: string[];
  };
}

interface SaveTicketReplyRequest extends Request {
  body: {
    ticketId: string;
    username: string;
    title: string;
    content: string;
  };
}

export const createFeedback = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { feedback, rating } = req.body;
    const { id } = req.user;

    if (!feedback) {
      res.send({
        success: false,
        message: 'Please provide feedback',
      });
      return;
    }
    if (rating < 0 || rating > 5) {
      res.send({
        success: false,
        message: 'Rating must be between 0 and 5',
      });
      return;
    }

    let uploadedfilename = '';
    if (req.file?.filename) {
      const oldPath = path.join(__dirname, '../uploads', req.file.filename);
      const extension = req.file?.mimetype.split('/')[1];
      fs.renameSync(oldPath, `${oldPath}.${extension}`);
      uploadedfilename = `uploads/${req.file.filename}.${extension}`;
    }

    const payload = {
      userId: id,
      rating,
      fbCnt: feedback,
      uploadedUrl: uploadedfilename,
    };

    const newFeedBack = new FeedBack(payload);
    try {
      await newFeedBack.save();
      res.json({ success: true, message: 'success to create feedback' });
    } catch (error) {
      console.log('Error is', error);
    }
  },
);

export const createTicket = catchAsyncErrors(
  async (req: any, res: Response, next: NextFunction) => {
    const { priority, subject, description } = req.body;
    const { id } = req.user;

    if (!priority) {
      res.send({ success: false, message: 'Priority is required' });
      return;
    }
    if (!subject) {
      res.send({ success: false, message: 'Subject is required' });
      return;
    }
    if (!description) {
      res.send({ success: false, message: 'Description is required' });
      return;
    }

    let uploadedfilename = '';
    if (req.file?.filename) {
      const oldPath = path.join(__dirname, '../uploads', req.file.filename);
      const extension = req.file?.mimetype.split('/')[1];
      fs.renameSync(oldPath, `${oldPath}.${extension}`);
      uploadedfilename = `uploads/${req.file.filename}.${extension}`;
    }

    const ticket = {
      userId: id,
      priority,
      subject,
      description,
      uploadedUrl: uploadedfilename,
    };

    const newTicket = new Ticket(ticket);
    try {
      await newTicket.save();
      res.json({ success: true, message: 'success to create ticket' });
    } catch (error) {
      console.log('Error is', error);
    }
  },
);

export const getFeedback = catchAsyncErrors(
  async (req: GetFeedbackRequest, res: Response, next: NextFunction) => {
    const {
      page = '1',
      pageSize = '10',
      keyword = '',
      dateRange = [],
    } = req.query;
    const query: any = {};

    if (keyword) {
      const users = await User.find({
        username: { $regex: keyword, $options: 'i' },
      });
      query.$or = [
        { fbCnt: { $regex: keyword, $options: 'i' } },
        { userId: { $in: users.map((user) => user._id) } },
      ];
    }
    if (dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      query.createdAt = {
        $gte: new Date(dateRange[0]),
        $lte: new Date(dateRange[1]),
      };
    }

    const feedbacks = await FeedBack.find(query)
      .populate({
        path: 'userId',
        select: 'username avatarBg',
        model: 'User',
      })
      .sort({ _id: -1 })
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .limit(parseInt(pageSize));

    const feedbacksTransformed = feedbacks.map((feedback) => ({
      user: feedback.userId,
      comment: feedback.fbCnt,
      rating: feedback.rating,
      image: feedback.uploadedUrl,
      createdAt: feedback.createdAt,
    }));

    const totalCount = await FeedBack.countDocuments(query);
    res.send({
      success: true,
      totalCount,
      feedbacks: feedbacksTransformed,
    });
  },
);

export const getTicket = catchAsyncErrors(
  async (req: GetTicketRequest, res: Response, next: NextFunction) => {
    const {
      page = '1',
      pageSize = '10',
      keyword = '',
      dateRange = [],
    } = req.query;
    const query: any = {};

    if (keyword) {
      const users = await User.find({
        username: { $regex: keyword, $options: 'i' },
      });
      query.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { subject: { $regex: keyword, $options: 'i' } },
        { userId: { $in: users.map((user) => user._id) } },
      ];
    }
    if (dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      query.createdAt = {
        $gte: new Date(dateRange[0]),
        $lte: new Date(dateRange[1]),
      };
    }

    const tickets = await Ticket.find(query)
      .populate({
        path: 'userId',
        select: 'username avatarBg',
        model: 'User',
      })
      .sort({ _id: -1 })
      .skip((parseInt(page) - 1) * parseInt(pageSize))
      .limit(parseInt(pageSize));

    const ticketsTransformed = tickets.map((ticket) => ({
      id: ticket._id,
      title: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdBy: ticket.userId,
      image: ticket.uploadedUrl,
      createdAt: ticket.createdAt,
    }));

    const totalCount = await Ticket.countDocuments(query);
    res.send({
      success: true,
      totalCount,
      tickets: ticketsTransformed,
    });
  },
);

export const saveTicketReply = catchAsyncErrors(
  async (req: SaveTicketReplyRequest, res: Response, next: NextFunction) => {
    const { ticketId, username, title, content } = req.body;

    if (!title || !content) {
      res.send({
        success: false,
        message: 'You should enter any title and content.',
      });
      return;
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.send({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.send({
        success: false,
        message: 'User not found',
      });
      return;
    }

    await notificationService.create({
      userId: username,
      title,
      type: config.NOTIFICATION_TYPES.IMPORTANT,
      message: `YOUR TICKET(${ticket.subject}) has been resolved. ${content}`,
      adminCreated: true,
    });

    ticket.status = 'RESOLVED';
    await ticket.save();
    res.send({
      success: true,
      message: 'Reply saved successfully.',
    });
  },
);
