import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';

import {
  referrals,
  getParentReferrers,
} from '../controllers/referralsController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, referrals);
router.route('/parents').get(isAuthenticatedUser, getParentReferrers);

module.exports = router;
