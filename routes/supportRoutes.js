const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const {
    createFeedback,
} = require("../controllers/supportController");
const multer = require("multer");
const upload = multer({dest: 'uploads/'});

// const { imageUpload } = require("../middlewares/imageUpload");
const router = express.Router();


router.route("/feedback").post(isAuthenticatedUser, upload.single('files') ,createFeedback);

module.exports = router;
