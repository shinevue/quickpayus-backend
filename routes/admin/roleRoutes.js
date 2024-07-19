const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  create,
  get,
  updateRole,
  remove,
} = require("../../controllers/admin/roleController");

const router = express.Router();

router
  .route("/")
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, get);

router
  .route("/:id")
  .put(isAuthenticatedUser, authorizeRole, updateRole)
  .delete(isAuthenticatedUser, authorizeRole, remove);

module.exports = router;
