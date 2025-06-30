
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
const validateMongoId = require("../middlewares/validatorMiddleware");

const router = express.Router();

router
  .patch("/changePassword/:id", validateMongoId, changePassword);

router
  .route("/")
  .get(getAllUsers)
  .post(createUserValidator, validateMongoId, createUser);

router
  .route("/login")
  .post(loginUserValidator, validateMongoId, loginUser);

router
  .route("/:id")
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
