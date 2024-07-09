const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const FeedBack = require("../models/feedbackModel");
const Ticket = require("../models/ticketModel");

exports.createFeedback = catchAsyncErrors(async (req, res, next) => {
    const {id} = req.user;
    const extension = req.file?.mimetype.split("/")[1];
    const uploadedfilename = req.file?.path + "." + extension;
    const feedback = {
        userId: id,
        fbCnt: req.body.feedback,
        uploadedUrl: uploadedfilename
    };
    const newFeedBack = new FeedBack(feedback);
    try{
        await newFeedBack.save();
        res.json({sucess: true, message: "success to create feedback"});
    } catch (error) {
        console.log("Error is",error);
    }
});

exports.createTicket = catchAsyncErrors(async (req, res, next) => {
    const {id} = req.user;
    const extension = req.file?.mimetype.split("/")[1];
    const uploadedfilename = req.file?.path + "." + extension;
    const ticket = {
        userId: id,
        subject: req.body.subject,
        description: req.body.description,
        uploadedUrl: uploadedfilename
    };
    const newTicket = new Ticket(ticket);
    try{
        await newTicket.save();
        res.json({success: true, message: "success to create feedback"});
    } catch (error) {
        console.log("Error is",error);
    }
});