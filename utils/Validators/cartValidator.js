const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const addToCartValidator = [
  body("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  validatorMiddleware,
];

const updateCartItemValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  validatorMiddleware,
];

const removeFromCartValidator = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
  validatorMiddleware,
];

module.exports = {
  addToCartValidator,
  updateCartItemValidator,
  removeFromCartValidator,
};
