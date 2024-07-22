const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");

const {
  get,
  upsert,
} = require("../../controllers/admin/profitConfigController");

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRole, get)
  .post(isAuthenticatedUser, authorizeRole, upsert);

module.exports = router;
