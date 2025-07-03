const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const addToWishlistValidator = [
  body("productId").isMongoId().withMessage("Invalid product ID"),
  validatorMiddleware,
];

const removeFromWishlistValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  validatorMiddleware,
];

module.exports = { addToWishlistValidator, removeFromWishlistValidator };
