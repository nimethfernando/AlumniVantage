const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {
  try {
    // Check if the token is in the cookies OR the Authorization header
    const token = 
      req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    // If no token is found, deny access
    if (!token) {
      return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    // Check if this token has been revoked (blacklisted)
    const [blacklisted] = await pool.execute(
      'SELECT token FROM token_blacklist WHERE token = ?', 
      [token]
    );
    if (blacklisted.length > 0) {
      return res.status(401).json({ error: "Token has been revoked. Please log in again." });
    }

    // Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user data to the request object
    req.user = decoded; 

    // Move to the next middleware/controller
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = verifyToken;