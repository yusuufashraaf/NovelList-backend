
const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  loginUser,
  deactivateUser
} = require("../controllers/userController");

const { createUserValidator } = require("../middlewares/userValidator");
const { loginUserValidator } = require("../middlewares/userValidator");
const { changePasswordValidator } = require("../middlewares/userValidator");  
const validateMongoId = require("../middlewares/validatorMiddleware");
const { protect } = require("../controllers/authController");
const {allowedTo} = require("../controllers/authController");
const { getMe } = require("../controllers/authController");
const router = express.Router();

router
  .patch("/changePassword/:id",protect, changePasswordValidator, validateMongoId, changePassword);

router
  .route("/")
  .get(getAllUsers)
  .post(createUserValidator, validateMongoId, createUser);

// router
//   .route("/login")
//   .post(loginUserValidator, validateMongoId, loginUser);

router
  .get('/me', protect, getMe);

router
  .route("/:id")
  .get(protect, getUserById)
  .patch(protect, updateUser)
  .delete(protect, allowedTo("admin"), deleteUser);

router
  .route("/deactivate/:id")
  .patch(protect, deactivateUser);

module.exports = router;
