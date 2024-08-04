import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';
import { get, update } from '../../controllers/admin/ranksController';

const router = express.Router();

/**
 * @method post
 * @body reward ObjectId
 * @desc to update the reward status to approved
 */

router
  .route('/')
  .get(isAuthenticatedUser, authorizeRole, get)
  .put(isAuthenticatedUser, authorizeRole, update);

module.exports = router;
