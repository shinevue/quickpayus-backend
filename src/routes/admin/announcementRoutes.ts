import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';

import {
  create,
  get,
  remove,
  removeAll,
} from '../../controllers/announcementController';
const router = express.Router();

router
  .route('/')
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, get)
  .delete(isAuthenticatedUser, authorizeRole, remove);

router
  .route('/removeall')
  .delete(isAuthenticatedUser, authorizeRole, removeAll);

export default router;
