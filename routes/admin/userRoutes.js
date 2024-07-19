const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const {
  deleteUser,
  get,
  getUser,
  updateStatus,
  claimedRewards,
  updateStatusOfReward,
  claimReward,
  updateKyc,
} = require("../../controllers/admin/usersController");
const router = express.Router();

router.route("/").get(isAuthenticatedUser, authorizeRole, get);
router
  .route("/update/status")
  .put(isAuthenticatedUser, authorizeRole, updateStatus);

router
  .route("/update/kyc")
  .put(isAuthenticatedUser, authorizeRole, updateKyc);

router
  .route("/claimed-rewards")
  .get(isAuthenticatedUser, authorizeRole, claimedRewards)
  .put(isAuthenticatedUser, authorizeRole, updateStatusOfReward);

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRole, getUser)
  .delete(isAuthenticatedUser, authorizeRole, deleteUser);

module.exports = router;
