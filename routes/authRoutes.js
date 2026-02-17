const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', authController.register);
router.post('/login', authController.login);
// GET /api/auth/verify/:token (This matches the link in the email)
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;