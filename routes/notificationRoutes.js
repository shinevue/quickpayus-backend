const express = require("express");
const { isAuthenticatedUser, authorizeRole } = require("../middlewares/auth");
const { get, updateMany, updateRead, deleteOne, deleteMany } = require("../controllers/notificationController");
const router = express.Router()
router.route("/")
    .get(isAuthenticatedUser, get)
    .put(isAuthenticatedUser, updateMany)
    .delete(isAuthenticatedUser, deleteMany);

router.route("/:id")
    .put(isAuthenticatedUser, updateRead)
    .delete(isAuthenticatedUser, deleteOne);

module.exports = router;
