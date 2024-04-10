const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

const {
  referrals,
  getParentReferrers,
} = require("../controllers/referralsController");
const router = express.Router();

router.route("/").get(isAuthenticatedUser, referrals);
router.route("/parents").get(isAuthenticatedUser, getParentReferrers);

module.exports = router;
