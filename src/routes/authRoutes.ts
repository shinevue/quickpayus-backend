import express from 'express';
import {
  createUser,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  checkAuth,
  checkDataExist,
  usernameToName,
  changePassword,
  deactivateAccount,
  deleteUser,
  checkRole,
  checkSecurityQuestion,
  checkBackupCode,
} from '../controllers/authController';
import { isAuthenticatedUser, authorizeRole } from '../middlewares/auth';
const router = express.Router();
router
  .post('/signup', createUser)
  .post('/user/exists', checkDataExist)
  .post('/user/name', usernameToName)
  .get('/check', isAuthenticatedUser, checkAuth)
  .post('/signin', signin)
  .get('/signout', signout)
  .post('/password/forgot', forgotPassword)
  .post('/delete', deleteUser)
  .put('/password/reset/:token', resetPassword)
  .patch('/password/change', isAuthenticatedUser, changePassword)
  .patch('/user/deactivate', isAuthenticatedUser, deactivateAccount)
  .post('/checkrole', isAuthenticatedUser, checkRole)
  .post('/security_question', isAuthenticatedUser, checkSecurityQuestion)
  .post('/backupcode', isAuthenticatedUser, checkBackupCode);

export default router;
