const express = require("express");
const {
  createUser,
  signin,
  signout,
  forgotPassword,
  resetPassword,
  checkAuth,
  checkDataExist,
  usernameToName,
  changePassword,
} = require("../controllers/authController");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const router = express.Router();
router
  .post("/signup", createUser)
  .post("/user/exists", checkDataExist)
  .post("/user/name", usernameToName)
  .get("/check", isAuthenticatedUser, checkAuth)
  .post("/signin", signin)
  .get("/signout", signout)
  .post("/password/forgot", forgotPassword)
  .put("/password/reset/:token", resetPassword)
  .patch("/password/change", isAuthenticatedUser, changePassword);

module.exports = router;
