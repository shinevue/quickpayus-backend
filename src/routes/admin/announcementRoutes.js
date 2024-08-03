const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");

const {
  create,
  get,
  remove,
  removeAll,
} = require("../../controllers/announcementController");
const router = express.Router();

router
  .route("/")
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, get)
  .delete(isAuthenticatedUser, authorizeRole, remove);

router
  .route("/removeall")
  .delete(isAuthenticatedUser, authorizeRole, removeAll);

module.exports = router;
