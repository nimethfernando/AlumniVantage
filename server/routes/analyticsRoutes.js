// server/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyApiKey = require('../middleware/verifyApiKey');
const requireRole = require('../middleware/requireRole');

// GET /api/analytics/filters - Fetch dynamic options for dashboard dropdowns
router.get(
  '/filters',
  verifyToken,
  requireRole('admin'),
  verifyApiKey(['read:analytics']), 
  analyticsController.getFilterOptions // Make sure this is added in your analyticsController.js as previously discussed!
);

// GET /api/analytics - Main dashboard analytics data
router.get(
  '/', 
  verifyToken, 
  requireRole('admin'), 
  verifyApiKey(['read:analytics']),
  analyticsController.getDashboardAnalytics
);

module.exports = router;