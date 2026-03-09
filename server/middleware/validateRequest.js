const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return a 400 Bad Request with the array of validation errors
    return res.status(400).json({ errors: errors.array() });
  }
  next(); // If no errors, proceed to the controller
};

module.exports = validateRequest;