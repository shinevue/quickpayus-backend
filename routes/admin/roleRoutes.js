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
  .post(isAuthenticatedUser, authorizeRole("admin"), create)
  .get(isAuthenticatedUser, authorizeRole("admin"), get);

router
  .route("/:id")
  .put(isAuthenticatedUser, authorizeRole("admin"), updateRole)
  .delete(isAuthenticatedUser, authorizeRole("admin"), remove);

module.exports = router;
