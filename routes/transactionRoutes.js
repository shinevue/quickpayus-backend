const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const transactionCtlr = require("../controllers/transactionController");
const router = express.Router();
router
  .route("/")
  .get(isAuthenticatedUser, transactionCtlr.get)
  .post(isAuthenticatedUser, transactionCtlr.create);

module.exports = router;
