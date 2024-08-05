import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import profileCtrl from '../../controllers/admin/profileController';

const router = express.Router();

router
  .route('/')
  .post(isAuthenticatedUser, authorizeRole, profileCtrl.create)
  .get(isAuthenticatedUser, authorizeRole, profileCtrl.getAllUser);

router
  .route('/:id')
  .put(isAuthenticatedUser, authorizeRole, profileCtrl.edit)
  .delete(isAuthenticatedUser, authorizeRole, profileCtrl.remove);

export default router;
