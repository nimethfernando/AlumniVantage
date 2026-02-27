const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/authMiddleware'); // Uncommented this line!

// GET Profile
router.get('/', verifyToken, profileController.getProfile); // Added verifyToken

// UPDATE Profile (with image upload)
router.post('/', verifyToken, upload.single('profile_image'), profileController.updateProfile); // Added verifyToken

// ADD Degree
router.post('/degrees', verifyToken, profileController.addDegree);

// ADD Certification
router.post('/certifications', verifyToken, profileController.addCertification);
router.post('/licenses', verifyToken, profileController.addLicense);
router.post('/courses', verifyToken, profileController.addCourse);
router.post('/employment', verifyToken, profileController.addEmployment);

module.exports = router;