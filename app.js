import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; // Security middleware
import rateLimit from 'express-rate-limit'; // Rate limiting middleware
import morgan from 'morgan';
import path from 'path';
import cors from 'cors';
import errorMiddleware from './src/utils/errorHandler.ts';

const app = express();

const MAX_API_RATE_LIMIT = process.env.MAX_API_RATE_LIMIT || 3000000;

const MAX_BAN_TIME_MS = process.env.MAX_BAN_TIME_MS || 1 * 60 * 1000;

app.enable('trust proxy');
app.set('trust proxy', 1);

app.use(morgan('combined'));

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
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    exposedHeaders: ['X-Total-Records', 'X-Total-Pages'],
  }),
);

//route Imports
import authRoutes from './src/routes/authRoutes';
import adminUserRoutes from './src/routes/admin/usersRoutes.ts';
import profileRoutes from './src/routes/admin/profileRoutes';
import adminRoleRoutes from './src/routes/admin/roleRoutes.ts';
import adminReceiverAddress from './src/routes/admin/receiverAddressRoutes.ts';
import adminTransactionRoutes from './src/routes/admin/transactionRoutes';
import notificationRoutes from './src/routes/notificationRoutes';
import programRoutes from './src/routes/programRoutes';
import ranksRoutes from './src/routes/admin/ranksRoutes';
import adminProfitConfigRoutes from './src/routes/admin/profitConfigRoutes';
import transactionRoutes from './src/routes/transactionRoutes';
import referralRoutes from './src/routes/referralRoutes';
import userRoutes from './src/routes/userRoutes';
import analyticsRoutes from './src/routes/analyticsRoutes';
import adminAnalyticsRoutes from './src/routes/admin/analyticsRoutes';
import adminAnnouncementRoutes from './src/routes/admin/announcementRoutes';
import adminNotificationRoutes from './src/routes/admin/notificationRoutes.ts';
import announcementRoutes from './src/routes/announcementRoutes';
import rankRoutes from './src/routes/rankRoutes';
import otpRoutes from './src/routes/otpRoutes';
import rewardRoutes from './src/routes/rewardRoutes';
import supportRoutes from './src/routes/supportRoutes';

// import {checkDeletedUser} from "./src/controllers/authController";    // import check deleted user inspect path

// import {seedDummyUsers} from "./src/seeder/users";

const BASE_ROUTE = '/api/v1';

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

app.set('view engine', 'ejs');
app.set('views', './utils/emailTemplates');

app.get('/email', async (req, res) => {
  res.render('emailConfirm', {
    title: 'EJS Components Example',
    content: 'This is the content of the main page.',
  });
});

app.use(
  '/uploads',
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // or specify your origin
    next();
  },
  express.static(path.join(__dirname, 'uploads')),
);

// errorMidelware
app.use(errorMiddleware);
module.exports = app;
