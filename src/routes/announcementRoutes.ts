import express from "express";
import { isAuthenticatedUser } from "../middlewares/auth";
import { get } from "../controllers/announcementController";
const router = express.Router();
router.route("/").get(isAuthenticatedUser, get);
module.exports = router;
