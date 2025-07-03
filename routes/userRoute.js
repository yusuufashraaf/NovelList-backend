
const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  loginUser,
} = require("../controllers/userController");

const { createUserValidator } = require("../middlewares/userValidator");
const { loginUserValidator } = require("../middlewares/userValidator");
const { changePasswordValidator } = require("../middlewares/userValidator");  
const validateMongoId = require("../middlewares/validatorMiddleware");
const { protect } = require("../controllers/authController");
const {allowedTo} = require("../controllers/authController");
const router = express.Router();

router
  .patch("/changePassword/:id",protect, changePasswordValidator, validateMongoId, changePassword);

router
  .route("/")
  .get(protect, getAllUsers)
  .post(createUserValidator, validateMongoId, createUser);

// router
//   .route("/login")
//   .post(loginUserValidator, validateMongoId, loginUser);

router
  .route("/:id")
  .get(protect, allowedTo("admin"), getUserById)
  .patch(protect, allowedTo("admin"), updateUser)
  .delete(protect, allowedTo("admin"), deleteUser);

module.exports = router;
