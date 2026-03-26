const express = require('express');
const router = express.Router();
const apiKeyController = require('../controllers/apiKeyController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/api-keys', verifyToken, apiKeyController.generateApiKey);

module.exports = router;