const { check } = require("express-validator");
const handleValidationErrors = require('./handleValidationErrors');

// validateRegisterInput is a combination Express middleware that uses the 
// `check` middleware to validate the keys in the body of a request to 
// register a user
const validateRegisterInput = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Email is invalid'),
  check('age')
    .exists({ checkFalsy: true })
    .isInt({ min: 18, max: 120 })
    .withMessage('Must be at least 18 years old'),
  check('name')
    .exists({ checkFalsy: true })
    .isLength({ min: 2, max: 30 })
    .withMessage('name must be between 2 and 30 characters'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6, max: 30 })
    .withMessage('Password must be between 6 and 30 characters'),
  handleValidationErrors
];

module.exports = validateRegisterInput;