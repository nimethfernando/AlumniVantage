const crypto = require('crypto');
const db = require('../config/db');

// 1. Generate Key (The one you just fixed)
exports.generateApiKey = async (req, res) => {
  try {
    const { client_name, scope } = req.body;
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized. User ID missing.' });
    if (!client_name || !scope) return res.status(400).json({ error: 'client_name and scope are required.' });
    
    const allowedScopes = ['read:analytics', 'read:alumni', 'read:alumni_of_day', 'read:donations'];
    
    if (!allowedScopes.includes(scope)) return res.status(400).json({ error: 'Invalid scope provided.' });
    
    const apiKey = 'dev_key_' + crypto.randomBytes(8).toString('hex');
    
    const [result] = await db.query(
      `INSERT INTO api_keys (user_id, client_name, api_key, scope, created_at, is_revoked)
       VALUES (?, ?, ?, ?, NOW(), false)`,
      [userId, client_name, apiKey, scope]
    );
    
    res.status(201).json({ message: 'API key generated successfully', apiKey, id: result.insertId });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
};

// 2. Get Keys (REQUIRED to stop the crash)
exports.getApiKeys = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
    
    const [rows] = await db.query(
      `SELECT id, client_name, scope, is_revoked, created_at
       FROM api_keys WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

// 3. Revoke Key (REQUIRED)
exports.revokeApiKey = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
    
    const [result] = await db.query(
      'UPDATE api_keys SET is_revoked = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (result.affectedRows === 0) return res.status(404).json({ error: 'API key not found' });
    
    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

// 4. Get Key Stats (REQUIRED)
exports.getApiKeyStatsById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { id } = req.params;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
    
    const [rows] = await db.query(
      `SELECT id, client_name, api_key, scope, is_revoked, created_at, last_used_at, usage_count
       FROM api_keys WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    
    if (rows.length === 0) return res.status(404).json({ error: 'API key not found' });
    
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Get API key stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};