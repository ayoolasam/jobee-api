const jwt = require("jsonwebtoken");
const User = require("../models/users");
const catchAsyncErrors = require("./catchAsyncErrors");
const errorHandler = require("../utils/errorHandler");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new errorHandler(
        "You are not authorized ,login first to access this resource",
        401
      )
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decoded.id);

  next();
});


//Handling user roles
exports.authorizeRoles = (...roles)=>{
return(req,res,next)=>{
  if(!roles.includes(req.user.role)){
    return next(new errorHandler(`Role (${req.user.role}) Not authorized to access this",403`))
  }
  next();
}
}
