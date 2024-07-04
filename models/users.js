const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please eneter your have a name"],
    trim: true,
  },
  email: {
    type: String,
    validate: [validator.isEmail, "Please add a valid email"],
    required: [true, "please enter your email address"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "please enter your password"],
    minlength: [8, "your password must be at least 8 characters long"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
    enum: {
      values: ["user", "employer"],
      message: "please enter a valid role",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//Return jsonwebtoken
userSchema.methods.generateToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRES_IN,
  });
};
//compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//generate password reset tpken
userSchema.methods.getResetPasswordToken = function () {
  //generate token
  const resetToken = crypto.randomBytes(20).toString("hex");
  //hash and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  //set expire token time
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
