import express from 'express';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';
import {
  get,
  updateMany,
  updateRead,
  deleteOne,
  deleteMany,
} from '../controllers/notificationController';
const router = express.Router();
router
  .route('/')
  .get(isAuthenticatedUser, get)
  .put(isAuthenticatedUser, updateMany)
  .delete(isAuthenticatedUser, deleteMany);

router
  .route('/:id')
  .put(isAuthenticatedUser, updateRead)
  .delete(isAuthenticatedUser, deleteOne);

module.exports = router;
