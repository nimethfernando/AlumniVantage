const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const registerValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email format.')
    .normalizeEmail() // Sanitization: lowercases and standardizes the email
    .custom((value) => {
      // Domain Validation
      if (!value.endsWith('@my.westminster.ac.uk')) {
        throw new Error('Registration restricted to @my.westminster.ac.uk emails only.');
      }
      return true;
    }),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain 1 uppercase letter, 1 number, and 1 special character.')
    .escape() // Sanitization: Escapes HTML characters to prevent XSS
];

const loginValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Valid email format is required.')
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.')
    .escape()
];

const forgotPasswordValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Valid email format is required.')
    .normalizeEmail()
];

const resetPasswordValidationRules = [
  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain 1 uppercase letter, 1 number, and 1 special character.')
    .escape()
];

// All your auth routes:
router.post('/register',registerValidationRules, validateRequest, authController.register);
router.post('/login', loginValidationRules, validateRequest, authController.login);
router.get('/verify/:token',forgotPasswordValidationRules, validateRequest, authController.verifyEmail);
router.post('/logout', logoutValidationRules, validateRequest, authController.logout);
router.post('/forgot-password', forgotPasswordValidationRules, validateRequest, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidationRules, validateRequest, authController.resetPassword);

module.exports = router;