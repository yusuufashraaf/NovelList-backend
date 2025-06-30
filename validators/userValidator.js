const User = require('../models/userAuthModel');
const { check } = require('express-validator');

exports.createUserValidator = [
    check('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3 })
        .withMessage('Name must be at least 3 characters long')
        .isLength({ max: 32 })
        .withMessage('Name must be less than 32 characters long'),
    check('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please include a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(user => {
                if (user) {
                    return Promise.reject('Email already in use');
                }
            });
        }),
    check('password', 'Please enter a password with 6 or more characters')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .isLength({ max: 32 })
        .withMessage('Password must be less than 32 characters long')

]