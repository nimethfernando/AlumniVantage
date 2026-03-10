const pool = require('../config/db');

const apiLogger = async (req, res, next) => {
  // Capture request details
  const method = req.method;
  const endpoint = req.originalUrl;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Listen for the response to finish so we can grab the final status code 
  // and the decoded user ID (if authMiddleware validated their token)
  res.on('finish', async () => {
    // If authMiddleware was triggered, req.user will exist
    const userId = req.user ? req.user.userId : null;
    const statusCode = res.statusCode;

    try {
      await pool.execute(
        `INSERT INTO api_logs 
        (user_id, method, endpoint, status_code, ip_address, user_agent) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, method, endpoint, statusCode, ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Failed to log API usage:', error.message);
    }
  });

  next(); // Pass control to the next middleware/route handler
};

module.exports = apiLogger;