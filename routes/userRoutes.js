const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const {
  updateProfile,
  claimReward,
  getUser,
  getAllUser,
  kycUpsert,
} = require("../controllers/userController");
const { imageUpload } = require("../middlewares/imageUpload");
const router = express.Router();

router.route("/:uuid").get(isAuthenticatedUser, getUser);
router.route("/all/:key").get(getAllUser);
router.put("/update/profile", isAuthenticatedUser, updateProfile);
router
  .route("/update/kyc")
  .post(isAuthenticatedUser, 
    imageUpload.fields([{name: "images", maxCount: 3}, {name: "documents", maxCount: 3}]), kycUpsert);

module.exports = router;
