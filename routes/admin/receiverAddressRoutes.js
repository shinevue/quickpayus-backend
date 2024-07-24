const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  addReceiver,
} = require("../../controllers/admin/receiverAddressController");

const router = express.Router();

router.route("/").post(isAuthenticatedUser, authorizeRole, addReceiver);

module.exports = router;
