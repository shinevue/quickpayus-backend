import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import {
  deleteUser,
  get,
  getUser,
  updateStatus,
  claimedRewards,
  updateStatusOfReward,
  claimReward,
  suspendUser,
  updateKyc,
  editUser,
} from '../../controllers/admin/usersController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, authorizeRole, get);
router
  .route('/update/status')
  .put(isAuthenticatedUser, authorizeRole, updateStatus);

router.route('/update/kyc').put(isAuthenticatedUser, authorizeRole, updateKyc);

router
  .route('/claimed-rewards')
  .get(isAuthenticatedUser, authorizeRole, claimedRewards)
  .put(isAuthenticatedUser, authorizeRole, updateStatusOfReward);

router
  .route('/:id')
  .get(isAuthenticatedUser, authorizeRole, getUser)
  .delete(isAuthenticatedUser, authorizeRole, deleteUser)
  .put(isAuthenticatedUser, authorizeRole, editUser);

router.route('/:id').get(isAuthenticatedUser, authorizeRole, getUser);

router.put('/suspend/:id', isAuthenticatedUser, authorizeRole, suspendUser);

module.exports = router;
