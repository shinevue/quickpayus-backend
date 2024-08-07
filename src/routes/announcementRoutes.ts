import express from 'express';
import { isAuthenticatedUser } from '../middlewares/auth';
import { get, remove, readOne } from '../controllers/announcementController';
const router = express.Router();
router.route('/').get(isAuthenticatedUser, get);
router
  .route('/:id')
  .delete(isAuthenticatedUser, remove)
  .put(isAuthenticatedUser, readOne);
export default router;
