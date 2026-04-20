// server/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyApiKey = require('../middleware/verifyApiKey');
const requireRole = require('../middleware/requireRole');

// GET /api/analytics
router.get(
  '/', 
  verifyToken, 
  requireRole('developer', 'admin', 'alumnus'), 
  verifyApiKey(['read:analytics']), // Check if verifyApiKey also has this bug in its file!
  analyticsController.getDashboardAnalytics
);

module.exports = router;