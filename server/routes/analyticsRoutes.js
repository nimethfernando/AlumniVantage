const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const verifyToken = require('../middleware/authMiddleware');
const verifyApiKey = require('../middleware/verifyApiKey');
const requireRole = require('../middleware/requireRole');

// GET /api/analytics
// Requires: 1. Valid Login, 2. Authorized Role, 3. Valid API Key with 'read:analytics' scope
router.get(
  '/', 
  verifyToken, 
  requireRole(['developer', 'admin', 'university']),
  verifyApiKey(['read:analytics']), 
  analyticsController.getDashboardAnalytics
);

module.exports = router;