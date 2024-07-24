const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  updateAddress
} = require("../../controllers/admin/receiverAddressController");

const router = express.Router();

router
  .route("/")
  .put(isAuthenticatedUser, authorizeRole, updateAddress)

module.exports = router;
