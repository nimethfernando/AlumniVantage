const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumniController');
const verifyToken = require('../middleware/authMiddleware');
const verifyApiKey = require('../middleware/verifyApiKey');
const requireRole = require('../middleware/requireRole');

// Requires: 1. Valid Login, 2. Authorized Role, 3. Valid API Key with 'read:alumni' scope
// Dynamic filter options route
router.get(
  '/filter-options', 
  verifyToken, 
  requireRole(['developer', 'admin', 'alumnus']),
  verifyApiKey(['read:alumni']), 
  alumniController.getFilterOptions
);

// Main directory route
router.get(
  '/', 
  verifyToken, 
  requireRole(['developer', 'admin', 'alumnus']),
  verifyApiKey(['read:alumni']), 
  alumniController.getAlumniDirectory
);

module.exports = router;