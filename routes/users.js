const express = require("express");
const {
  createNewUser,
  loginUser,
  forgotPassword,
} = require("../controllers/usersController");
const router = express.Router();

router.post("/register", createNewUser);
router.post("/login", loginUser);
router.post("/password/forgot", forgotPassword);

module.exports = router;
