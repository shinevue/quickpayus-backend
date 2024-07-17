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
} = require("../../controllers/roleController");
const router = express.Router();

router
  .route("/")
  .post(isAuthenticatedUser, authorizeRole("admin"), create)
  .get(isAuthenticatedUser, authorizeRole("admin"), get)
  .put(isAuthenticatedUser, authorizeRole("admin"), update)
  .delete(isAuthenticatedUser, authorizeRole("admin"), remove);

router
  .route("/removeall")
  .delete(isAuthenticatedUser, authorizeRole("admin"), removeAll);

module.exports = router;
