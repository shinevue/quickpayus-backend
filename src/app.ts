import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; // Security middleware
import rateLimit from 'express-rate-limit'; // Rate limiting middleware
import morgan from 'morgan';
import path from 'path';
import cors from 'cors';
import errorMiddleware from './middlewares/errorMiddleware '; // Adjusted import for TypeScript

const app = express();

const MAX_API_RATE_LIMIT = process.env.MAX_API_RATE_LIMIT
  ? parseInt(process.env.MAX_API_RATE_LIMIT)
  : 3000000;
const MAX_BAN_TIME_MS = process.env.MAX_BAN_TIME_MS
  ? parseInt(process.env.MAX_BAN_TIME_MS)
  : 1 * 60 * 1000;

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

// Route Imports
import authRoutes from './routes/authRoutes';
import adminUserRoutes from './routes/admin/usersRoutes';
import profileRoutes from './routes/admin/profileRoutes';
import adminRoleRoutes from './routes/admin/roleRoutes';
import adminReceiverAddress from './routes/admin/receiverAddressRoutes';
import adminTransactionRoutes from './routes/admin/transactionRoutes';
import notificationRoutes from './routes/notificationRoutes';
import programRoutes from './routes/programRoutes';
import ranksRoutes from './routes/admin/ranksRoutes';
import adminProfitConfigRoutes from './routes/admin/profitConfigRoutes';
import transactionRoutes from './routes/transactionRoutes';
import referralRoutes from './routes/referralRoutes';
import userRoutes from './routes/userRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminAnalyticsRoutes from './routes/admin/analyticsRoutes';
import adminAnnouncementRoutes from './routes/admin/announcementRoutes';
import adminNotificationRoutes from './routes/admin/notificationRoutes';
import announcementRoutes from './routes/announcementRoutes';
import rankRoutes from './routes/rankRoutes';
import otpRoutes from './routes/otpRoutes';
import rewardRoutes from './routes/rewardRoutes';
import supportRoutes from './routes/supportRoutes';

// Uncomment if needed
// import { checkDeletedUser } from "./src/controllers/authController";
// import { seedDummyUsers } from "./src/seeder/users";

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

// Uncomment if needed
// checkDeletedUser();
// seedDummyUsers();

app.set('view engine', 'ejs');
app.set('views', './utils/emailTemplates');

app.get('/email', async (req: Request, res: Response) => {
  res.render('emailConfirm', {
    title: 'EJS Components Example',
    content: 'This is the content of the main page.',
  });
});

app.use(
  '/uploads',
  (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*'); // or specify your origin
    next();
  },
  express.static(path.join(__dirname, '../uploads')),
);

// Error Middleware
app.use(errorMiddleware);

export default app; // Changed to ES module export
