const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");

const { counts } = require("../controllers/analyticsController");
const router = express.Router();

router.route("/counts").get(isAuthenticatedUser, counts);

module.exports = router;
