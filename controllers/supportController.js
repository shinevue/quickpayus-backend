const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const FeedBack = require("../models/feedbackModel");

exports.createFeedback = catchAsyncErrors(async (req, res, next) => {
    const {id} = req.user;
    const extension = req.file.mimetype.split("/")[1];
    const uploadedfilename = req.file.path + "." + extension;
    const feedback = {
        userId: id,
        fbCnt: req.body.feedback,
        uploadedUrl: uploadedfilename
    };
    const newFeedBack = new FeedBack(feedback);
    try{
        const result = newFeedBack.save();
        res.json({result, message: "success to create feedback"});
    } catch (error) {
        console.log("Error is",error);
    }
});