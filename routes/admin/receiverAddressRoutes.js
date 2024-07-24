const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  getAllReceiver,
  addReceiver,
} = require("../../controllers/admin/receiverAddressController");

const router = express.Router();

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRole, getAllReceiver)
  .post(isAuthenticatedUser, authorizeRole, addReceiver);


module.exports = router;
