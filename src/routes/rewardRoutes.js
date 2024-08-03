const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

const { get, claimReward } = require("../controllers/rewardsController");
const router = express.Router();

router.route("/").get(isAuthenticatedUser, get);

router.route("/claim-reward").post(isAuthenticatedUser, claimReward);

module.exports = router;
