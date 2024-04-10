const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const { get } = require("../../controllers/admin/ranksController");

const router = express.Router();
router
  .route("/")
  .get(isAuthenticatedUser, authorizeRole("admin"), get);

module.exports = router;
