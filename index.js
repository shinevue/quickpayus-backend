const dotenv = require("dotenv");
const app = require("./app.js");

const connectDB = require("./src/config/db.js");
//Handling uncaught exception
process.on("uncaughtException", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down server due to Uncaught Rejection`);
  process.exit(1);
});
//config
dotenv.config();

const receiverAddressCtr = require("./src/controllers/admin/receiverAddressController")
receiverAddressCtr.defaultReceiver();

const server = app.listen(process.env.PORT, async () => {
  console.log(`Server is running on port: ${process.env.PORT}`);
});
connectDB();
// unhandled Promise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Shutting down server due to Unhandled Rejection`);
  server.close(() => {
    process.exit(1);
  });
});
