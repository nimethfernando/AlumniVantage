const pool = require('../config/db');

const verifyApiKey = async (req, res, next) => {
  // 1. Look for the API key in the request headers
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ error: 'Access denied. API Key is missing.' });
  }

  try {
    // 2. Check if the key exists and is not revoked
    const [rows] = await pool.execute(
      'SELECT * FROM api_keys WHERE api_key = ? AND is_revoked = FALSE', 
      [apiKey]
    );

    const keyData = rows[0];

    if (!keyData) {
      return res.status(403).json({ error: 'Invalid or revoked API Key' });
    }

    // 3. API KEY SCOPING
    if (keyData.scope !== 'read:featured') {
      return res.status(403).json({ error: 'API Key does not have the required scope' });
    }

    // 4. Update usage stats
    await pool.execute(
      `UPDATE api_keys 
       SET last_used_at = NOW(), 
           usage_count = usage_count + 1
       WHERE id = ?`,
      [keyData.id]
    );

    // Success
    req.apiClient = keyData;
    next();
    
  } catch (error) {
    console.error('API Key Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = verifyApiKey;