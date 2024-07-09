const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

const {
  counts,
  getBalanceInformation,
} = require("../controllers/analyticsController");
const router = express.Router();

router.route("/counts").get(isAuthenticatedUser, counts);

/**
 * to get information for chart in dashbaord
 * @param balanceframe [profits, credits, rewards]
 * @param timeframe [day, week, month]
 *
 */
router
  .route("/:balanceframe/:timeframe")
  .get(isAuthenticatedUser, getBalanceInformation);

module.exports = router;
