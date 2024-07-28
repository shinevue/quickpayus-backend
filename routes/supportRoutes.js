const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const {
    createFeedback,
    createTicket,
    getFeedback,
    getTicket
} = require("../controllers/supportController");
const multer = require("multer");
const upload = multer({ dest: 'uploads/' });

// const { imageUpload } = require("../middlewares/imageUpload");
const router = express.Router();


router.route("/feedback")
    .get(isAuthenticatedUser, authorizeRole, getFeedback)
    .post(isAuthenticatedUser, upload.single('files'), createFeedback);

router.route("/ticket")
    .get(isAuthenticatedUser, authorizeRole, getTicket)
    .post(isAuthenticatedUser, upload.single('files'), createTicket);

module.exports = router;
