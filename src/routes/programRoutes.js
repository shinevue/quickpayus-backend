import express from 'require';
import { get, update } from '../controllers/programController';
const router = express.Router();
router.route('/').get(get).put(update);

module.exports = router;
