const User = require('../models/userAuthModel');
const { check } = require('express-validator');

exports.createUserValidator = [
  check('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters long')
    .isLength({ max: 32 }).withMessage('Name must be less than 32 characters long'),

  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please include a valid email')
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('Bad credentials');
      }
      return true;
    }),

  check('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .isLength({ max: 32 }).withMessage('Password must be less than 32 characters long'),

  check('confirmPassword')
    .notEmpty().withMessage('Confirm Password is required')
    .isLength({ min: 6 }).withMessage('Confirm Password must be at least 6 characters long')
    .isLength({ max: 32 }).withMessage('Confirm Password must be less than 32 characters long')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    
  check('role')
    .optional()
];
