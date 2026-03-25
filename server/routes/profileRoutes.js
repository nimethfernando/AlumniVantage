const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');
const verifyToken = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

// VALIDATION & SANITIZATION RULES
const profileRules = [
    body('bio').optional().isString().trim().escape(),
    body('linkedin_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim()
];

const degreeRules = [
    body('degree_name').notEmpty().withMessage('Degree name is required').trim().escape(),
    body('university_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim(),
    body('completion_date').notEmpty().withMessage('Completion date is required')
];

const certificationRules = [
    body('cert_name').notEmpty().withMessage('Certification name is required').trim().escape(),
    body('course_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim(),
    body('completion_date').notEmpty().withMessage('Completion date is required')
];

const licenseRules = [
    body('license_name').notEmpty().withMessage('License name is required').trim().escape(),
    body('awarding_body_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim(),
    body('completion_date').notEmpty().withMessage('Completion date is required')
];

const courseRules = [
    body('course_name').notEmpty().withMessage('Course name is required').trim().escape(),
    body('course_url').optional({ checkFalsy: true }).isURL().withMessage('Must be a valid URL').trim(),
    body('completion_date').notEmpty().withMessage('Completion date is required')
];

const employmentRules = [
    body('job_title').notEmpty().withMessage('Job title is required').trim().escape(),
    body('company_name').notEmpty().withMessage('Company name is required').trim().escape(),
    body('start_date').notEmpty().withMessage('Start date is required')
];

// ROUTES
router.get('/', verifyToken, profileController.getProfile);

router.post('/', verifyToken, upload.single('profile_image'), profileRules, validateRequest, profileController.updateProfile);

// ADD Entries
router.post('/degrees', verifyToken, degreeRules, validateRequest, profileController.addDegree);
router.post('/certifications', verifyToken, certificationRules, validateRequest, profileController.addCertification);
router.post('/licenses', verifyToken, licenseRules, validateRequest, profileController.addLicense);
router.post('/courses', verifyToken, courseRules, validateRequest, profileController.addCourse);
router.post('/employment', verifyToken, employmentRules, validateRequest, profileController.addEmployment);

// UPDATE Sub-Entries
router.put('/degree/:id', verifyToken, degreeRules, validateRequest, profileController.updateDegree);
router.put('/certification/:id', verifyToken, certificationRules, validateRequest, profileController.updateCertification);
router.put('/license/:id', verifyToken, licenseRules, validateRequest, profileController.updateLicense);
router.put('/course/:id', verifyToken, courseRules, validateRequest, profileController.updateCourse);
router.put('/employment/:id', verifyToken, employmentRules, validateRequest, profileController.updateEmployment);

// DELETE Entries
router.delete('/degree/:id', verifyToken, profileController.deleteDegree);
router.delete('/certification/:id', verifyToken, profileController.deleteCertification);
router.delete('/license/:id', verifyToken, profileController.deleteLicense);
router.delete('/course/:id', verifyToken, profileController.deleteCourse);
router.delete('/employment/:id', verifyToken, profileController.deleteEmployment);

module.exports = router;