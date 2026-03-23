const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body, param } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');
const rateLimit = require('express-rate-limit');

// ==========================================
// RATE LIMITER
// ==========================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// VALIDATION RULES
// ==========================================

const registerValidationRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email format.')
    .custom((value) => {
      const lowerValue = value.toLowerCase();
      if (
        !lowerValue.endsWith('@my.westminster.ac.uk') &&
        !lowerValue.endsWith('@westminster.ac.uk')
      ) {
        throw new Error('Registration restricted to Westminster University emails only.');
      }
      return true;
    })
    .normalizeEmail(),
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain 1 uppercase letter, 1 number, and 1 special character.')
    .escape()
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
  param('token')
    .notEmpty().withMessage('Token parameter is required.'),
  body('newPassword')
    .trim()
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain 1 uppercase letter, 1 number, and 1 special character.')
    .escape()
];

// ==========================================
// ROUTES
// ==========================================

// Apply rate limiter globally to all auth routes
router.use(authLimiter);

router.post('/register', registerValidationRules, validateRequest, authController.register);
router.post('/login', loginValidationRules, validateRequest, authController.login);
router.get('/verify/:token', validateRequest, authController.verifyEmail);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidationRules, validateRequest, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidationRules, validateRequest, authController.resetPassword);

module.exports = router;