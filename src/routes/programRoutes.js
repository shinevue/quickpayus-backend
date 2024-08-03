const express = require("express");
const { get, update } = require("../controllers/programController");
const router = express.Router();
router.route("/").get(get).put(update);

module.exports = router;
