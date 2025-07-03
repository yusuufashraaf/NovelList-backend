const User = require('../models/userAuthModel');
const { check } = require('express-validator');
const bcrypt = require('bcryptjs');

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

exports.loginUserValidator = [
  check('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please include a valid email'),

  check('password')
    .notEmpty().withMessage('Password is required')
    .custom(async (value, { req }) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user || !(await user.matchPassword(value))) {
        throw new Error('Bad credentials');
      }

      // Attach user to req for later use (e.g. in controller)
      req.user = user;
      return true;
    })
];

exports.changePasswordValidator = [
      check('currentPassword')
        .notEmpty().withMessage('Current password is required'),
      
      check('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
        .isLength({ max: 32 }).withMessage('New password must be less than 32 characters')
        .custom(async (value, { req }) => {
          const user = await User.findById(req.params.id).select('+password');
          if (!user || !(await user.matchPassword(req.body.currentPassword))) {
            throw new Error('Invalid current password');
          }
          const isSame = await bcrypt.compare(value, user.password);
          if (isSame) {
            throw new Error('New password must be different from the current password');
          }
          return true;
        }),
  
      check('confirmPassword')
        .notEmpty().withMessage('Confirm password is required')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Passwords do not match');
          }
          return true;
        }),
];