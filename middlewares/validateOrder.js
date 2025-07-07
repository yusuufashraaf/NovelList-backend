const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Helper function to check if string is valid ObjectId
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

// Validation rules for creating an order
const validateCreateOrder = [

  // Books array validation
  body('books')
    .isArray({ min: 1 })
    .withMessage('Books must be an array with at least one item'),

  // Validate each book in the books array
  body('books.*.book')
    .notEmpty()
    .withMessage('Book ID is required')
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Book must be a valid ObjectId');
      }
      return true;
    }),

  body('books.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),

  body('books.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  // Total price validation
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be a positive number'),

  // Status validation (optional for create, has default)
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Status must be one of: pending, processing, shipped, delivered, cancelled'),

  // Shipping address validation - consider making required if needed for your business logic
  body('shippingAddress.street')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Street must be a non-empty string'),

  body('shippingAddress.city')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('City must be a non-empty string'),

  body('shippingAddress.state')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('State must be a non-empty string'),

  body('shippingAddress.zipCode')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Zip code must be a non-empty string'),

  body('shippingAddress.country')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Country must be a non-empty string'),

  // Payment method validation - consider making required if needed
  body('paymentMethod')
    .optional()
    .isIn(['paypal'])
    .withMessage('Payment method must be paypal'),

  // Order number validation (usually auto-generated, so keeping optional)
  body('orderNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Order number must be a non-empty string'),
];

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Export the validation middleware
module.exports = {
  validateCreateOrder,
  handleValidationErrors
};