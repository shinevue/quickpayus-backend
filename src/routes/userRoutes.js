import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';
import {
  updateProfile,
  claimReward,
  getUser,
  getAllUser,
  kycUpsert,
  enable2FA,
} from '../controllers/userController';
import { imageUpload } from '../middlewares/imageUpload';
const router = express.Router();

router.route('/:uuid').get(isAuthenticatedUser, getUser);
router.route('/all/:key').get(getAllUser);
router.put('/update/profile', isAuthenticatedUser, updateProfile);
router.put('/update/enable2FA', isAuthenticatedUser, enable2FA);
router.route('/update/kyc').post(
  isAuthenticatedUser,
  imageUpload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'documents', maxCount: 3 },
  ]),
  kycUpsert,
);

module.exports = router;
