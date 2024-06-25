const express = require("express");
const app = express();
const dotenv = require("dotenv");


//setting up config.env file variation
dotenv.config({ path: "./config/config.env" });

const databaseConnection = require("./config/database");

databaseConnection();

//Importing routes
const job = require("./routes/jobs");

app.use(express.json());

app.use("/api/v1", job);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(
    `Server started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
