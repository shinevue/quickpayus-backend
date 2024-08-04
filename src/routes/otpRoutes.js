import express from 'require';
import { isAuthenticatedUser } from '../middlewares/auth';
import otpCtlr from '../controllers/otpController';
const router = express.Router();
import otpMiddleware from '../middlewares/otp';
router
  .route('/create')
  .post(isAuthenticatedUser, otpMiddleware, otpCtlr.create);
router
  .route('/verify')
  .post(isAuthenticatedUser, otpMiddleware, otpCtlr.verify);
router.route('/send').post(isAuthenticatedUser, otpCtlr.send);
router.route('/confirm').post(otpCtlr.confirm); // send otp code after sign up immediatley.

module.exports = router;
