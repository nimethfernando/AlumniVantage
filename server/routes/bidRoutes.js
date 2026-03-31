const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');

// Correctly import your middleware based on your authMiddleware.js file
const verifyToken = require('../middleware/authMiddleware'); 

// Apply auth middleware to all bid routes
router.use(verifyToken); 

router.get('/tomorrow', bidController.getTomorrowSlot);
router.post('/', bidController.placeOrUpdateBid);
router.get('/status', bidController.getBidStatus);
router.get('/history', bidController.getBidHistory);
router.delete('/cancel', bidController.cancelBid);

module.exports = router;