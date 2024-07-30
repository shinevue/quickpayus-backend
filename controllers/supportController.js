const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const FeedBack = require("../models/feedbackModel");
const Ticket = require("../models/ticketModel");
const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");
const notificationService = require("../services/notificationService");
const { NOTIFICATION_TYPES } = require("../config/constants");

exports.createFeedback = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.user;

    const oldPath = path.join(__dirname, '../uploads', req.file.filename);
    const extension = req.file?.mimetype.split("/")[1];

    // Rename the file
    fs.renameSync(oldPath, `${oldPath}.${extension}`);

    const uploadedfilename = `uploads/${req.file.filename}.${extension}`;
    const feedback = {
        userId: id,
        fbCnt: req.body.feedback,
        uploadedUrl: uploadedfilename
    };
    const newFeedBack = new FeedBack(feedback);
    try {
        await newFeedBack.save();
        res.json({ sucess: true, message: "success to create feedback" });
    } catch (error) {
        console.log("Error is", error);
    }
    res.send({
        success: true

    })
});

exports.createTicket = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.user;

    const oldPath = path.join(__dirname, '../uploads', req.file.filename);
    const extension = req.file?.mimetype.split("/")[1];

    // Rename the file
    fs.renameSync(oldPath, `${oldPath}.${extension}`);

    const uploadedfilename = `uploads/${req.file.filename}.${extension}`;
    const ticket = {
        userId: id,
        priority: req.body.priority,
        subject: req.body.subject,
        description: req.body.description,
        uploadedUrl: uploadedfilename
    };
    const newTicket = new Ticket(ticket);
    try {
        await newTicket.save();
        res.json({ success: true, message: "success to create feedback" });
    } catch (error) {
        console.log("Error is", error);
    }
});

exports.getFeedback = catchAsyncErrors(async (req, res, next) => {
    const { page = 1, pageSize = 10, keyword = "", dateRange = [] } = req.query;

    const query = {};
    if (keyword) {
        const users = await User.find({ username: { $regex: keyword, $options: "i" } });
        console.log(users.map(user => user._id))
        query.$or = [
            { fbCnt: { $regex: keyword, $options: "i" } },
            { userId: { $in: users.map(user => user._id) } }
        ]
    }
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        query.createdAt = {
            $gte: new Date(dateRange[0]), $lte: new Date(dateRange[1]),
        }
    }

    const feedbacks = await FeedBack.find(query)
        .populate({
            path: 'userId',
            select: 'username avatarBg',
            model: 'User'
        })
        .sort({ _id: -1 }).skip((page - 1) * pageSize).limit(pageSize);

    const feedbacksTransformed = feedbacks.map(feedback => ({
        user: feedback.userId,
        comment: feedback.fbCnt,
        rating: feedback.rating,
        image: feedback.uploadedUrl,
        createdAt: feedback.createdAt
    }));

    const totalCount = await FeedBack.countDocuments(query);

    res.send({
        success: true,
        totalCount,
        feedbacks: feedbacksTransformed
    })
})



exports.getTicket = catchAsyncErrors(async (req, res, next) => {
    const { page = 1, pageSize = 10, keyword = "", dateRange = [] } = req.query;

    const query = {};
    if (keyword) {
        const users = await User.find({ username: { $regex: keyword, $options: "i" } });
        console.log(users.map(user => user._id))
        query.$or = [
            { description: { $regex: keyword, $options: "i" } },
            { subject: { $regex: keyword, $options: "i" } },
            { userId: { $in: users.map(user => user._id) } }
        ]
    }
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
        query.createdAt = {
            $gte: new Date(dateRange[0]), $lte: new Date(dateRange[1]),
        }
    }

    const feedbacks = await Ticket.find(query)
        .populate({
            path: 'userId',
            select: 'username avatarBg',
            model: 'User'
        })
        .sort({ _id: -1 }).skip((page - 1) * pageSize).limit(pageSize);

    const ticketsTransformed = feedbacks.map(ticket => ({
        id: ticket._id,
        title: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        createdBy: ticket.userId.username,
        image: ticket.uploadedUrl,
        createdAt: ticket.createdAt
    }));

    const totalCount = await Ticket.countDocuments(query);

    res.send({
        success: true,
        totalCount,
        tickets: ticketsTransformed
    })
})

exports.saveTicketReply = catchAsyncErrors(async (req, res, next) => {
    const { ticketId, username, title, content } = req.body;

    if (!title || !content) {
        res.send({
            success: false,
            message: "You should enter any title and content."
        });
        return;
    }

    const user = await User.findOne({ username });

    if (!user) {
        res.send({
            success: false,
            message: "User not found"
        });
    }
    const ticket = await Ticket.findById(ticketId);


    if (!ticket) {
        res.send({
            success: false,
            message: "Ticket not found"
        });
    }
    await notificationService.create({
        userId: user._id,
        title,
        type: NOTIFICATION_TYPES.IMPORTANT,
        message: `YOUR TICKET(${ticket.subject}) has been resolved. ${content}`,
        adminCreated: true
    });

    ticket.status = "RESOLVED";
    await ticket.save();

    res.send({
        success: true,
        message: "Reply saved successfully."
    });

})