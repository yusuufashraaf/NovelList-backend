<<<<<<< HEAD
const {Router} = require("express");
const {getAllUsers, getUserById, createUser, updateUser, deleteUser} = require("../controllers/userController");
 
const router = Router();
=======
const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const { createUserValidator } = require("../middlewares/userValidator");
const validateMongoId = require("../middlewares/validatorMiddleware");

const router = express.Router();
>>>>>>> 09272e8c422533690ca86ca99be8426237bcb5dd

router
  .route("/")
  .get(getAllUsers)
  .post(createUserValidator, validateMongoId, createUser);

router
  .route("/:id")
  .get(getUserById)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
