import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import { counts } from '../../controllers/admin/analyticsController';

const router = express.Router();
router.route('/counts').get(isAuthenticatedUser, authorizeRole, counts);

module.exports = router;
