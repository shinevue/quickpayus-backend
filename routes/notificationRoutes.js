const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const { get, updateMany } = require("../controllers/notificationController");
const router = express.Router();
router.get("/", isAuthenticatedUser, get);
router.put("/", isAuthenticatedUser, updateMany);

module.exports = router;
