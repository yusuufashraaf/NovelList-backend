const express = require("express");
const { signup, login, forgotPassword } = require("../controllers/authController");
const { signupValidator, loginValidator } = require("../middlewares/authValidator");
const router = express.Router();

router
  .route("/signup")
  .post(signupValidator, signup);

router
  .route("/login")
  .post(loginValidator, login);

router
  .route("/forgotPassword")
  .post(forgotPassword);
// router
//   .route("/:id")
//   .get(getUserById)
//   .patch(updateUser)
//   .delete(deleteUser);

module.exports = router;
