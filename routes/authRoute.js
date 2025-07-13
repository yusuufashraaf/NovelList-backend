const express = require("express");
const { signup, login, forgotPassword, verifyPasswordResetCode, resetPassword, logout, googleSignIn, verifyEmail, githubSignIn } = require("../controllers/authController");
const { signupValidator, loginValidator } = require("../middlewares/authValidator");
const { protect } = require("../controllers/authController");
const passport = require('passport');
const jwt = require('jsonwebtoken');

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

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/' }),
  async (req, res) => {
    try {
      if (!req.user) {
        console.error("No user found in GitHub callback");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      console.log("GitHub login successful, redirecting with token...");
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
    } catch (err) {
      console.error("GitHub callback error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// router
//   .route("/:id")
//   .get(getUserById)
//   .patch(updateUser)
//   .delete(deleteUser);

module.exports = router;
