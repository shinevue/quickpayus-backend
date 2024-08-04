import express from 'express';
const router = express.Router();
import { isAuthenticatedUser, authorizeRole } from '../../middlewares/auth';

import { get, upsert } from '../../controllers/admin/profitConfigController';

router
  .route('/')
  .get(isAuthenticatedUser, authorizeRole, get)
  .post(isAuthenticatedUser, authorizeRole, upsert);

export default router;
