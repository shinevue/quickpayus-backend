import express from 'express';
import { isAuthenticatedUser } from '../middlewares/auth';
import RankCtrl from '../controllers/ranksController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, RankCtrl.rank);

export default router;
