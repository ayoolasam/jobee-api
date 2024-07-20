const ErrorHandler = require("../utils/errorHandler");
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === "development") {
    res.status(err.statusCode).json({
      success: false,
      error: err,
      errMessage: err.message,
      stack: err.stack,
    });
  }

  if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    error.message = err.message;
    //handling mongoose duplicate error
    if (err.code === 11000) {
      const message = `Duplicate ${object.keys(err.keyValue)} entered.`;
      error = new ErrorHandler(message, 400);
    }
    //wrong mongoose object ID error

    if (err.name === "CastError") {
      const message = `Resource not found. Invalid ${err.path}`;
      error = new ErrorHandler(message, 404);
    }
    //handling Mongoose Validation Error
    if (err.name === "ValidationError") {
      const message = Object.values(err.errors).map((value) => value.message);
      error = new ErrorHandler(message, 404);
    }
    //handling wromg jwt token error
if(err.name === "JsonWebTokenError"){
const message = "JSON web token invalid. Try again"
error = new ErrorHandler(message,500)
}

//handling expired jwt token error
if(err.name === "TokenExpiredError"){
  const message = "JSON web token expired. Try again"
  error = new ErrorHandler(message,500)
}

    res.status(error.statusCode).json({
      success: false,
      message: error.message || "internal server Error.",
    });
  }
};
