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
} = require("../../controllers/admin/notificationsController");
const router = express.Router();

router
  .route("/")
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, get);
router.route("/:id").delete(isAuthenticatedUser, authorizeRole, remove);

router
  .route("/removeall")
  .delete(isAuthenticatedUser, authorizeRole, removeAll);

module.exports = router;
