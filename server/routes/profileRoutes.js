const express = require('express');
const { body } = require('express-validator'); 
const router = express.Router();
const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

//  VALIDATION & SANITIZATION RULES
const profileRules = [
    body('bio').optional().isString().trim().escape(), // .escape() prevents XSS attacks here
    body('linkedin_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim()
];
const degreeRules = [
    body('degree_name').notEmpty().withMessage('Degree name is required').trim().escape(),
    body('university_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim()
];
const certAndCourseRules = [
    body('name').notEmpty().withMessage('Name is required').trim().escape(),
    body('url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim()
];
const employmentRules = [
    body('job_title').notEmpty().withMessage('Job title is required').trim().escape(),
    body('company').notEmpty().withMessage('Company is required').trim().escape()
];

// ROUTES
// GET Profile
router.get('/', verifyToken, profileController.getProfile);
router.post('/', verifyToken, upload.single('profile_image'), profileRules, validateRequest, profileController.updateProfile);
// ADD Entries
router.post('/degrees', verifyToken, degreeRules, validateRequest, profileController.addDegree);
router.post('/certifications', verifyToken, certAndCourseRules, validateRequest, profileController.addCertification);
router.post('/licenses', verifyToken, certAndCourseRules, validateRequest, profileController.addLicense);
router.post('/courses', verifyToken, certAndCourseRules, validateRequest, profileController.addCourse);
router.post('/employment', verifyToken, employmentRules, validateRequest, profileController.addEmployment);

// UPDATE Sub-Entries
router.put('/degree/:id', verifyToken, degreeRules, validateRequest, profileController.updateDegree);
router.put('/certification/:id', verifyToken, certAndCourseRules, validateRequest, profileController.updateCertification);
router.put('/license/:id', verifyToken, certAndCourseRules, validateRequest, profileController.updateLicense);
router.put('/course/:id', verifyToken, certAndCourseRules, validateRequest, profileController.updateCourse);
router.put('/employment/:id', verifyToken, employmentRules, validateRequest, profileController.updateEmployment);

// DELETE Entries (No body validation needed for DELETE, just the token)
router.delete('/degree/:id', verifyToken, profileController.deleteDegree);
router.delete('/certification/:id', verifyToken, profileController.deleteCertification);
router.delete('/license/:id', verifyToken, profileController.deleteLicense);
router.delete('/course/:id', verifyToken, profileController.deleteCourse);
router.delete('/employment/:id', verifyToken, profileController.deleteEmployment);

module.exports = router;