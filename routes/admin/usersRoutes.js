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
  suspendUser,
  updateKyc,
  editUser,
} = require("../../controllers/admin/usersController");
const router = express.Router();

router.route("/").get(isAuthenticatedUser, authorizeRole("admin"), get);
router
  .route("/update/status")
  .put(isAuthenticatedUser, authorizeRole("admin"), updateStatus);

router
  .route("/update/kyc")
  .put(isAuthenticatedUser, authorizeRole("admin"), updateKyc);

router
  .route("/claimed-rewards")
  .get(isAuthenticatedUser, authorizeRole("admin"), claimedRewards)
  .put(isAuthenticatedUser, authorizeRole("admin"), updateStatusOfReward);

router
  .route("/:id")
  .get(isAuthenticatedUser, authorizeRole("admin"), getUser)
  .delete(isAuthenticatedUser, authorizeRole("admin"), deleteUser)
  .put(isAuthenticatedUser, authorizeRole("admin"), editUser);
router.route("/:id").get(isAuthenticatedUser, authorizeRole("admin"), getUser);

router.put(
  "/suspend/:id",
  isAuthenticatedUser,
  authorizeRole("admin"),
  suspendUser
);

module.exports = router;
