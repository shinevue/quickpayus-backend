import express from "express";
import { isAuthenticatedUser, authorizeRole } from "../middlewares/auth";

import {
  counts,
  getBalanceInformation,
} from "../controllers/analyticsController";
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
