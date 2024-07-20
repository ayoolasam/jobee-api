const express = require("express");
const {
  createNewUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,getMe,
  updatePassword,updateCurrentUser,deleteCurrentUser,
  getAppliedJobs,
  getAllCreatedJobs,
  displayAllusers,deleteUser
} = require("../controllers/usersController");
const { isAuthenticatedUser,authorizeRoles } = require("../middlewares/auth");
const router = express.Router();

router.post("/register", createNewUser);
router.post("/login", loginUser);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.get("/logout",isAuthenticatedUser , logoutUser);

router.get("/me",isAuthenticatedUser,getMe)
router.put("/password/changePassword",isAuthenticatedUser,updatePassword)
router.put("/update/me",isAuthenticatedUser,updateCurrentUser)
router.delete("/delete/me",isAuthenticatedUser,deleteCurrentUser)
router.get('/jobs/applied',isAuthenticatedUser,authorizeRoles("user"),getAppliedJobs)
router.get('/jobs/created',isAuthenticatedUser,authorizeRoles("admin","employer"),getAllCreatedJobs)
router.get('/users',isAuthenticatedUser,authorizeRoles("admin"),displayAllusers)
router.delete('/user/:id',isAuthenticatedUser,authorizeRoles("admin"),deleteUser)

module.exports = router;
