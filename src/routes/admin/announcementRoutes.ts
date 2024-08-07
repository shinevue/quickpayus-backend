import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';

import {
  create,
  getAll,
  remove,
  removeAll,
} from '../../controllers/announcementController';
const router = express.Router();

router
  .route('/')
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, getAll)
  .delete(isAuthenticatedUser, authorizeRole, remove);

router
  .route('/removeall')
  .delete(isAuthenticatedUser, authorizeRole, removeAll);

export default router;
