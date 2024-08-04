import express from 'require';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';
import {
  createFeedback,
  createTicket,
  getFeedback,
  getTicket,
  saveTicketReply,
} from '../controllers/supportController';
import multer from 'multer';
// import { imageUpload } from "../middlewares/imageUpload";

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router
  .route('/feedback')
  .get(isAuthenticatedUser, authorizeRole, getFeedback)
  .post(isAuthenticatedUser, upload.single('files'), createFeedback);

router
  .route('/ticket')
  .get(isAuthenticatedUser, authorizeRole, getTicket)
  .post(isAuthenticatedUser, upload.single('files'), createTicket);

router
  .route('/ticket/reply')
  .post(isAuthenticatedUser, authorizeRole, saveTicketReply);
module.exports = router;
