const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  create,
  get,
  edit,
  remove,
} = require("../../controllers/admin/profileController");

const router = express.Router();

router
  .route("/")
  .post(isAuthenticatedUser, authorizeRole("admin"), create)
  .get(isAuthenticatedUser, authorizeRole("admin"), get);

router
  .route("/:id")
  .put(isAuthenticatedUser, authorizeRole("admin"), edit)
  .delete(isAuthenticatedUser, authorizeRole("admin"), remove);

module.exports = router;
