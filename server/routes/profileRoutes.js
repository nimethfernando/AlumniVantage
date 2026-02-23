const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');
// const verifyToken = require('../middleware/authMiddleware'); // You need a JWT middleware to protect these routes!

// GET Profile
router.get('/', /* verifyToken, */ profileController.getProfile);

// UPDATE Profile (with image upload)
router.post('/', /* verifyToken, */ upload.single('profile_image'), profileController.updateProfile);

// ADD Degree
router.post('/degrees', /* verifyToken, */ profileController.addDegree);

module.exports = router;