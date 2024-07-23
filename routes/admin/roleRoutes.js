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
  getPermission,
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

router
  .route("/permission")
  .get(isAuthenticatedUser, authorizeRole, getPermission);

module.exports = router;
