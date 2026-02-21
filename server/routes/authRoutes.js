const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// All your auth routes:
router.post('/register', authController.register);
router.post('/login', authController.login); // <--- IS THIS LINE HERE?
router.get('/verify/:token', authController.verifyEmail);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;