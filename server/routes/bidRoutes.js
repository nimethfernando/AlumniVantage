const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { requireAuth } = require('../middleware/authMiddleware'); // Assuming this is your auth middleware

// Apply auth middleware to all bid routes
router.use(requireAuth); 

router.post('/', bidController.placeOrUpdateBid);
router.get('/status', bidController.getBidStatus);

module.exports = router;