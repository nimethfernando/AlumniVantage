const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');

// Correctly import your middleware based on your authMiddleware.js file
const verifyToken = require('../middleware/authMiddleware'); 

// Apply auth middleware to all bid routes
router.use(verifyToken); 

router.post('/', bidController.placeOrUpdateBid);
router.get('/status', bidController.getBidStatus);

module.exports = router;