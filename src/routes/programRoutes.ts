import express from 'express';
import { get, update } from '../controllers/programController';
const router = express.Router();
router.route('/').get(get).put(update);

export default router;
