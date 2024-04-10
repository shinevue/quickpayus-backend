const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const { update } = require("../../controllers/admin/transactionController");

const { get } = require("../../controllers/transactionController");

const router = express.Router();
router.route("/").get(isAuthenticatedUser, authorizeRole("admin"), get);

router
  .route("/status/update")
  .post(isAuthenticatedUser, authorizeRole("admin"), update);

module.exports = router;
