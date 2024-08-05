import express from 'express';
import programCtrl from '../controllers/programController';
const router = express.Router();
router.route('/').get(programCtrl.get).put(programCtrl.update);

export default router;
