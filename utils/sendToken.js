//create and send token and save in cookie

const sendToken = (user, statusCode, res, req) => {
  const token = user.generateToken();

  //cookie options
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  //   if(process.env.NODE_ENV === "production") {
  // options.secure = true
  //   }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message: "logged in successfully",
    token,
  });
};

module.exports = sendToken;
