const express = require("express");
const { signup, login, forgotPassword, verifyPasswordResetCode, resetPassword, logout, googleSignIn, verifyEmail } = require("../controllers/authController");
const { signupValidator, loginValidator } = require("../middlewares/authValidator");
const { protect } = require("../controllers/authController");
const router = express.Router();

router
  .route("/signup")
  .post(signupValidator, signup);

router
  .get("/verifyEmail/:otp", verifyEmail);

router
  .route("/login")
  .post(loginValidator, login);

router
  .route("/forgotPassword")
  .post(forgotPassword);

router
  .route("/verifyPasswordResetCode")
  .post(verifyPasswordResetCode);

router
  .route("/resetPassword")
  .patch(resetPassword);

router
  .post('/logout', logout);


router
  .route("/google")
  .post(googleSignIn);

// router
//   .route("/:id")
//   .get(getUserById)
//   .patch(updateUser)
//   .delete(deleteUser);

module.exports = router;
