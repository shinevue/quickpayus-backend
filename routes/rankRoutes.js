const express = require("express");
const { isAuthenticatedUser } = require("../middlewares/auth");
const { rank } = require("../controllers/ranksController");
const router = express.Router();

router.route("/").get(isAuthenticatedUser, rank);

module.exports = router;
