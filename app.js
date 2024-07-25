const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet"); // Security middleware
const rateLimit = require("express-rate-limit"); // Rate limiting middleware
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const app = express();
const errorMiddleware = require("./middlewares/defaultError");
const MAX_API_RATE_LIMIT = process.env.MAX_API_RATE_LIMIT || 30;

const MAX_BAN_TIME_MS = process.env.MAX_BAN_TIME_MS || 1 * 60 * 1000;

app.enable("trust proxy");
app.set("trust proxy", 1);

app.use(morgan("combined"));

const userRateLimiter = rateLimit({
  windowMs: MAX_BAN_TIME_MS,
  max: MAX_API_RATE_LIMIT,
  message: {
    success: false,
    message: `You have exceeded the ${MAX_API_RATE_LIMIT} requests per minute limit. Please try again later.`,
  },
});

app.use(userRateLimiter);
app.use(express.json());
app.use(helmet()); // Use helmet for security headers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads/kyc", express.static(path.join(__dirname, "uploads/kyc")));
//app.use(express.static("uploads"));
app.use(
  cors({
    origin: ["http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    exposedHeaders: ["X-Total-Records", "X-Total-Pages"],
  })
);

//route Imports
const authRoutes = require("./routes/authRoutes");
const adminUserRoutes = require("./routes/admin/usersRoutes.js");
const profileRoutes = require("./routes/admin/profileRoutes");
const adminRoleRoutes = require("./routes/admin/roleRoutes.js");
const adminReceiverAddress = require("./routes/admin/receiverAddressRoutes.js");
const adminTransactionRoutes = require("./routes/admin/transactionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const programRoutes = require("./routes/programRoutes");
const ranksRoutes = require("./routes/admin/ranksRoutes");
const adminProfitConfigRoutes = require("./routes/admin/profitConfigRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const referralRoutes = require("./routes/referralRoutes");
const userRoutes = require("./routes/userRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminAnalyticsRoutes = require("./routes/admin/analyticsRoutes");
const adminAnnouncementRoutes = require("./routes/admin/announcementRoutes");
const adminNotificationRoutes = require("./routes/admin/notificationRoutes.js");
const announcementRoutes = require("./routes/announcementRoutes");
const rankRoutes = require("./routes/rankRoutes");
const otpRoutes = require("./routes/otpRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const supportRoutes = require("./routes/supportRoutes");

// const {checkDeletedUser} = require("./controllers/authController");    // import check deleted user inspect part

// const {seedDummyUsers} = require("./seeder/users");

const BASE_ROUTE = "/api/v1";

app.use(`${BASE_ROUTE}/auth`, authRoutes);
app.use(`${BASE_ROUTE}/user`, userRoutes);
app.use(`${BASE_ROUTE}/notifications`, notificationRoutes);
app.use(`${BASE_ROUTE}/programs`, programRoutes);
app.use(`${BASE_ROUTE}/transactions`, transactionRoutes);
app.use(`${BASE_ROUTE}/referrals`, referralRoutes);
app.use(`${BASE_ROUTE}/analytics`, analyticsRoutes);
app.use(`${BASE_ROUTE}/admin/ranks`, ranksRoutes);
app.use(`${BASE_ROUTE}/admin/profitconfig`, adminProfitConfigRoutes);
app.use(`${BASE_ROUTE}/admin/analytics`, adminAnalyticsRoutes);
app.use(`${BASE_ROUTE}/admin/users`, adminUserRoutes);
app.use(`${BASE_ROUTE}/admin/profile`, profileRoutes);
app.use(`${BASE_ROUTE}/admin/roles`, adminRoleRoutes);
app.use(`${BASE_ROUTE}/admin/receiver`, adminReceiverAddress);
app.use(`${BASE_ROUTE}/admin/transactions`, adminTransactionRoutes);
app.use(`${BASE_ROUTE}/admin/announcements`, adminAnnouncementRoutes);
app.use(`${BASE_ROUTE}/admin/notifications`, adminNotificationRoutes);
app.use(`${BASE_ROUTE}/announcements`, announcementRoutes);
app.use(`${BASE_ROUTE}/rank`, rankRoutes);
app.use(`${BASE_ROUTE}/otp`, otpRoutes);
app.use(`${BASE_ROUTE}/reward`, rewardRoutes);
app.use(`${BASE_ROUTE}/support`, supportRoutes);

//  Check deleted status and remove finally part.
// checkDeletedUser();

// Make seed user's profile data
// seedDummyUsers();

app.set("view engine", "ejs");
app.set("views", "./utils/emailTemplates");

app.get("/email", async (req, res) => {
  res.render("emailConfirm", {
    title: "EJS Components Example",
    content: "This is the content of the main page.",
  });
});

app.use("/uploads", express.static("uploads"));

// errorMidelware
app.use(errorMiddleware);
module.exports = app;
