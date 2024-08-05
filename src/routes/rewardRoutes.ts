import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';

import rewardCtlr from '../controllers/rewardsController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, rewardCtlr.get);

router.route('/claim-reward').post(isAuthenticatedUser, rewardCtlr.claimReward);

export default router;
