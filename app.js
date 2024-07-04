const express = require("express");
const app = express();
const dotenv = require("dotenv");
const errorMiddleWare = require("./middlewares/errors");
const ErrorHandler = require("./utils/errorHandler");
const cookieParser = require("cookie-parser")

//setting up config.env file variation
dotenv.config({ path: "./config/config.env" });

const databaseConnection = require("./config/database");

app.use(express.json());
app.use(cookieParser())

//handling uncaught exceptions
process.on("uncaughtExceptions", (err) => {
  console.log(`Error:${err.message}`);
  console.log("Shutting downthe server  due to uncuaght exceptions ");
  procces.exit(1);
});

databaseConnection();

//Importing routes
const job = require("./routes/jobs");
const user = require("./routes/users")

app.use("/api/v1", job);
app.use("/api/v1", user);

//Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} Route not found`, 404));
});


app.use(errorMiddleWare);
const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(
    `Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});



//handling unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error :${err.message}`);
  console.log("Shutting down the server due to unhandled promiise rejection ");
  server.close(() => {
    process.exit(1);
  });
});
