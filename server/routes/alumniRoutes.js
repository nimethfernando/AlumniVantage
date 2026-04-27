const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumniController');
const verifyToken = require('../middleware/authMiddleware');
const verifyApiKey = require('../middleware/verifyApiKey');
const requireRole = require('../middleware/requireRole');

// ALUMNI DIRECTORY ROUTES (/api/alumni)

// 1. Dynamic filter options route
// Requires: 1. Valid Login, 2. Authorized Role, 3. Valid API Key with 'read:alumni' scope
router.get(
  '/filter-options', 
  verifyToken, 
  requireRole('developer', 'admin', 'alumnus'), 
  verifyApiKey(['read:alumni']), 
  alumniController.getFilterOptions
);

// 2. Main directory route (View All Alumni with Details)
// Requires: 1. Valid Login, 2. Authorized Role, 3. Valid API Key with 'read:alumnus' scope
router.get(
  '/', 
  verifyToken, 
  requireRole('developer', 'admin', 'alumnus'),
  verifyApiKey(['read:alumni']), 
  alumniController.getAlumniDirectory
);

module.exports = router;