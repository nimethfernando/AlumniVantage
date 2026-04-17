// server/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyApiKey = require('../middleware/verifyApiKey');

// The route is protected by both JWT (user session) AND the scoped API Key
// Notice we pass ['read:analytics'] to the middleware to enforce scoping
router.get(
  '/', 
  verifyToken, 
  verifyApiKey(['read:analytics']), 
  analyticsController.getDashboardAnalytics
);

module.exports = router;