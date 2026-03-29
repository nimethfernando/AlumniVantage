const pool = require('../config/db');

const apiLogger = async (req, res, next) => {
  const method = req.method;
  const endpoint = req.originalUrl;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';

  res.on('finish', async () => {
    const userId = req.user ? req.user.userId : null;
    const apiKeyId = req.apiClient ? req.apiClient.id : null;
    const statusCode = res.statusCode;

    try {
      await pool.execute(
        `INSERT INTO api_logs 
         (user_id, api_key_id, method, endpoint, status_code, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, apiKeyId, method, endpoint, statusCode, ipAddress, userAgent]
      );
    } catch (error) {
      console.error('Failed to log API usage:', error.message);
    }
  });

  next();
};

module.exports = apiLogger;