const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/api-keys', verifyToken, apiKeyController.generateApiKey);
router.get('/api-keys', verifyToken, apiKeyController.getApiKeys);
router.put('/api-keys/:id/revoke', verifyToken, apiKeyController.revokeApiKey);

module.exports = router;