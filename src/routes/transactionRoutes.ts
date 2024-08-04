import express from 'express';
import { isAuthenticatedUser } from '../middlewares/auth';
import transactionCtlr from '../controllers/transactionController';
const router = express.Router();
router
  .route('/')
  .get(isAuthenticatedUser, transactionCtlr.get)
  .post(isAuthenticatedUser, transactionCtlr.create);
router.route('/all/:key').get(isAuthenticatedUser, transactionCtlr.getAllTrans);
router.route('/receiver').get(isAuthenticatedUser, transactionCtlr.getAddress);
export default router;
