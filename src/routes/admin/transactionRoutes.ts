import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import { get, update } from '../../controllers/admin/transactionController';

const router = express.Router();
router.route('/').get(isAuthenticatedUser, authorizeRole, get);

router.route('/status/update').post(isAuthenticatedUser, authorizeRole, update);

export default router;
