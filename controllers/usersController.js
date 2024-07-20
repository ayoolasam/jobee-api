const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const User = require("../models/users");
const errorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/sendToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const Job = require("../models/Job.model");
const fs = require("fs");
const APIFilters = require("../utils/apiFilters");
const { error } = require("console");
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

//Reset password => /api/v1/password/reset/:token
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //get token from url
  //hash url token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new errorHandler(
        "Password reset Token is invalid or has been expired",
        400
      )
    );
  }

  //set up new passsword
  user.password = req.body.password;
  user.resetPasswordExpire = undefined;
  user.resetPasswordToken = undefined;

  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res);
});
//log out user /api/v1/logout
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "logged out Succesfully",
  });
});

//get current user profile
exports.getMe = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate({
    path: "jobsPublished",
    select: "title postingDate",
  });
  if (!user) {
    return next(new errorHandler("user not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

//current user wants to change password /api/v1/password/update
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new errorHandler("user not found", 404));
  }
  //check previous user password
  const isMatched = await user.comparePassword(req.body.currentPassword);

  if (!isMatched) {
    return next(new errorHandler("password is incorrect", 400));
  }

  user.password = req.body.newPassword;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, res);

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

//update current user details
exports.updateCurrentUser = catchAsyncErrors(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    message: "user Details updated",
    success: true,
    user,
  });
});

//delete current logged in user /api/v1/delete
exports.deleteCurrentUser = catchAsyncErrors(async (req, res, next) => {
  deleteUserData(req.user.id, req.user.role);

  const user = await User.findByIdAndDelete(req.user.id);
  res.cookie("token", "none", {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    message: " user account successfully deleted",
    success: true,
  });
});

//delete all users references and user
async function deleteUserData(user, role) {
  if (role === "employer") {
    await Job.deleteMany({ user: user });
  }
  if (role === "user") {
    const appliedJobs = await Job.find({ "applicantsApplied.id": user }).select(
      "+applicantsApplied"
    );
    for (let i = 0; i < appliedJobs.length; i++) {
      let obj = appliedJobs[i].applicantsApplied.find((o) => o.id === user);
      let filepath = `${__dirname}/public/uploads/${obj.resume}`.replace(
        "\\controllers",
        ""
      );
      fs.unlink(filepath, (err) => {
        if (err) return;
        console.log(err);
      });

      appliedJobs[i].applicantsApplied.splice(
        appliedJobs[i].applicantsApplied.indexOf(obj.id)
      );

     await appliedJobs[i].save();
    }
  }
}

// show all apllied jobs /api/v1/jobs/applied
exports.getAppliedJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ "applicantsApplied.id": req.user.id }).select(
    "+applicantsApplied"
  );

  res.status(200).json({ success: true, results: jobs.length, data: jobs });
});

//show all jobs created by employer
exports.getAllCreatedJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs,
  });
});

//admin display all the users
exports.displayAllusers = catchAsyncErrors(async (req, res, next) => {
  const apiFilters = new APIFilters(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const users = await apiFilters.query;

  res.status(200).json({
    success: true,
    results: users.length,
    data: users,
  });
});

//delete a particular user admin route /api/v1/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  console.log(user);

  if (!user) {
    return next(new errorHandler(`User not found ${req.params.id}`, 404));
  }

  deleteUserData(user.id, user.role);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully by Admin",
  });
});
