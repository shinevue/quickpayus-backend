const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const { get } = require("../controllers/announcementController");
const router = express.Router();
router.route("/").get(isAuthenticatedUser, get);
module.exports = router;
