const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const transactionCtlr = require("../controllers/transactionController");
const router = express.Router();
router
  .route("/")
  .get(isAuthenticatedUser, transactionCtlr.get)
  .post(isAuthenticatedUser, transactionCtlr.create);
router
  .route("/all/:key")
  .get(isAuthenticatedUser, transactionCtlr.getAllTrans)
module.exports = router;
