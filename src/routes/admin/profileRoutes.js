const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  create,
  getAllUser,
  edit,
  remove,
} = require("../../controllers/admin/profileController");

const router = express.Router();

router
  .route("/")
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, getAllUser);

router
  .route("/:id")
  .put(isAuthenticatedUser, authorizeRole, edit)
  .delete(isAuthenticatedUser, authorizeRole, remove);

module.exports = router;
