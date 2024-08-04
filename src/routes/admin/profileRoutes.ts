import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import {
  create,
  getAllUser,
  edit,
  remove,
} from '../../controllers/admin/profileController';

const router = express.Router();

router
  .route('/')
  .post(isAuthenticatedUser, authorizeRole, create)
  .get(isAuthenticatedUser, authorizeRole, getAllUser);

router
  .route('/:id')
  .put(isAuthenticatedUser, authorizeRole, edit)
  .delete(isAuthenticatedUser, authorizeRole, remove);

module.exports = router;
