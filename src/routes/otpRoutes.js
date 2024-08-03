const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const otpCtlr = require("../controllers/otpController");
const router = express.Router();
const otpMiddleware = require("../middlewares/otp");
router.route("/create").post(isAuthenticatedUser, otpMiddleware, otpCtlr.create);
router.route("/verify").post(isAuthenticatedUser, otpMiddleware, otpCtlr.verify);
router.route("/send").post(isAuthenticatedUser, otpCtlr.send);
router.route("/confirm").post(otpCtlr.confirm);  // send otp code after sign up immediatley.

module.exports = router;
