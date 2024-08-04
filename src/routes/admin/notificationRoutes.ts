import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';

import {
  create,
  get,
  remove,
  removeAll,
} from '../../controllers/admin/notificationsController';
const router = express.Router();

router
  .route('/')
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, get);
router.route('/:id').delete(isAuthenticatedUser, authorizeRole, remove);

router
  .route('/removeall')
  .delete(isAuthenticatedUser, authorizeRole, removeAll);

module.exports = router;
