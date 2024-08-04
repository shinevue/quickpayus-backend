import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import {
  create,
  get,
  updateRole,
  remove,
  getPermission,
} from '../../controllers/admin/roleController';

const router = express.Router();

router
  .route('/')
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, get);

router
  .route('/:id')
  .put(isAuthenticatedUser, authorizeRole, updateRole)
  .delete(isAuthenticatedUser, authorizeRole, remove);

router
  .route('/permission')
  .get(isAuthenticatedUser, authorizeRole, getPermission);

module.exports = router;
