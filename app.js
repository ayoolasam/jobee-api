const express = require("express");
const app = express();
const dotenv = require("dotenv");
const errorMiddleWare = require("./middlewares/errors");
const fileUpload = require("express-fileupload");
const ErrorHandler = require("./utils/errorHandler");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors")
const bodyParser = require()

//setting up config.env file variation
dotenv.config({ path: "./config/config.env" });

const databaseConnection = require("./config/database");

app.use(express.json());
app.use(cookieParser());

//handling uncaught exceptions
process.on("uncaughtExceptions", (err) => {
  console.log(`Error:${err.message}`);
  console.log("Shutting downthe server  due to uncuaght exceptions ");
  process.exit(1);
});

databaseConnection();

//setup security Headers
app.use(helmet());

//handle file upload
app.use(fileUpload());

//prevent parameter pollution

app.use(hpp());

//sanitize data
app.use(mongoSanitize());

//prevent xss attacks
app.use(xssClean());

//setup cors
app.use(cors());

//rate Limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 minutes
  max: 100,
});

app.use(limiter);

//Importing routes
const job = require("./routes/jobs");
const user = require("./routes/users");

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
