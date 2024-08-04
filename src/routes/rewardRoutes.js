import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';

import { get, claimReward } from '../controllers/rewardsController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, get);

router.route('/claim-reward').post(isAuthenticatedUser, claimReward);

module.exports = router;
