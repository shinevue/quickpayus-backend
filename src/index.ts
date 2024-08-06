import dotenv from 'dotenv';
import app from './app.js';

import connectDB from './config/db.js';
//Handling uncaught exception
process.on('uncaughtException', (err: Error) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down server due to Uncaught Rejection`);
  process.exit(1);
});
//config
dotenv.config();

import { defaultReceiver } from './controllers/admin/receiverAddressController.js';
defaultReceiver();

const server = app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port: ${process.env.PORT}`);
});
connectDB();
// unhandled Promise Rejection
process.on('unhandledRejection', (err: Error) => {
  console.log(`Error ${err}`);
  console.log(`Shutting down server due to Unhandled Rejection`);
  server.close(() => {
    process.exit(1);
  });
});
