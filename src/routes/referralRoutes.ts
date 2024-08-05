import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';

import referralCtlr from '../controllers/referralsController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, referralCtlr.referrals);
router.route('/parents').get(isAuthenticatedUser, referralCtlr.getParentReferrers);

export default router;
