import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';
import * as notificationCtrl from '../controllers/notificationController';
const router = express.Router();
router
  .route('/')
  .get(isAuthenticatedUser, notificationCtrl.get)
  .put(isAuthenticatedUser, notificationCtrl.updateMany)
  .delete(isAuthenticatedUser, notificationCtrl.deleteMany);

router
  .route('/:id')
  .put(isAuthenticatedUser, notificationCtrl.updateRead)
  .delete(isAuthenticatedUser, notificationCtrl.deleteOne);

export default router;
