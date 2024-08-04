import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import {
  getAllReceiver,
  addReceiver,
} from '../../controllers/admin/receiverAddressController';

const router = express.Router();

router
  .route('/')
  .get(isAuthenticatedUser, authorizeRole, getAllReceiver)
  .post(isAuthenticatedUser, authorizeRole, addReceiver);

module.exports = router;
