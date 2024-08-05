import dotenv from 'dotenv';
import app from './app.ts';

import connectDB from './src/config/db.ts';
//Handling uncaught exception
process.on('uncaughtException', (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down server due to Uncaught Rejection`);
  process.exit(1);
});
//config
dotenv.config();

import { defaultReceiver } from './src/controllers/admin/receiverAddressController.ts';
defaultReceiver();

const server = app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port: ${process.env.PORT}`);
});
connectDB();
// unhandled Promise Rejection
process.on('unhandledRejection', (err: any) => {
  console.log(`Error ${err}`);
  console.log(`Shutting down server due to Unhandled Rejection`);
  server.close(() => {
    process.exit(1);
  });
});
