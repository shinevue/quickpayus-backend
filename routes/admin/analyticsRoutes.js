const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const { counts } = require("../../controllers/admin/analyticsController");

const router = express.Router();
router
  .route("/counts")
  .get(isAuthenticatedUser, authorizeRole("admin"), counts);

module.exports = router;
