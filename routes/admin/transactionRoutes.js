const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const { get, update } = require("../../controllers/admin/transactionController");

const router = express.Router();
router.route("/").get(isAuthenticatedUser, authorizeRole, get);

router
  .route("/status/update")
  .post(isAuthenticatedUser, authorizeRole, update);

module.exports = router;
