const express = require("express");
const {
  isAuthenticatedUser,
  authorizeRole,
} = require("../../middlewares/auth");
const { get, update } = require("../../controllers/admin/ranksController");

const router = express.Router();

/**
 * @method post
 * @body reward ObjectId
 * @desc to update the reward status to approved
 */

router
  .route("/")
  .get(isAuthenticatedUser, authorizeRole("admin"), get)
  .put(isAuthenticatedUser, authorizeRole("admin"), update);

module.exports = router;
