const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const verifyToken = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

router.post('/api-keys', verifyToken,requireRole('developer'), apiKeyController.generateApiKey);
router.get('/api-keys', verifyToken,requireRole('developer'), apiKeyController.getApiKeys);
router.put('/api-keys/:id/revoke', verifyToken,requireRole('developer'), apiKeyController.revokeApiKey);
router.get('/api-keys/:id/stats', verifyToken,requireRole('developer'), apiKeyController.getApiKeyStatsById);

module.exports = router;