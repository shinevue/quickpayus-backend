import express from 'express';
import { isAuthenticatedUser } from '../middlewares/auth';
import { rank } from '../controllers/ranksController';
const router = express.Router();

router.route('/').get(isAuthenticatedUser, rank);

module.exports = router;
