const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const {
  updateProfile,
  claimReward,
  getUser,
  kycUpsert,
} = require("../controllers/userController");
const { imageUpload } = require("../middlewares/imageUpload");
const router = express.Router();

router.route("/:uuid").get(isAuthenticatedUser, getUser);
router.put("/update/profile", isAuthenticatedUser, updateProfile);
router
  .route("/update/kyc")
  .post(isAuthenticatedUser, imageUpload.array("images", 5), kycUpsert);

module.exports = router;
