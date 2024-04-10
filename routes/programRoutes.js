const express = require("express");
const { get } = require("../controllers/programController");
const router = express.Router();
router.get("/", get);

module.exports = router;
