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
  .get(isAuthenticatedUser, authorizeRole("admin"), get)
  .post(isAuthenticatedUser, authorizeRole("admin"), upsert);

module.exports = router;
