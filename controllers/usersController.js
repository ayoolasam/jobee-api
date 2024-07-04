const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/users");
const errorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/sendToken");
const sendEmail = require("../utils/sendEmail");

//register new user = /api/v1/register
exports.createNewUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new errorHandler("please fill in complete details", 400));
  }
  const user = await User.create({
    name,
    email,
    password,
    role,
  });
  sendToken(user, 200, res);
});

//login user /api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new errorHandler("please fill in complete details", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new errorHandler("user not found", 401));
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new errorHandler("Invalid password", 401));
  }

  sendToken(user, 200, res);
});

//forgot password /api/v1/password/forgot
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new errorHandler("User not Found", 404));
  }
  //get reset token from method
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  //create resetvpassword url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `your password reset link is as follow ${resetUrl} if you have not if you have not requested this please ignore`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset email for jobee-website",
      message,
    });
    res.status(200).json({
      sucess: true,
      message: `email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new errorHandler("email not sent", 400));
  }
});
