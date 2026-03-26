const crypto = require('crypto');
const db = require('../config/db');

exports.generateApiKey = async (req, res) => {
  try {
    const { client_name } = req.body;

    const apiKey = 'dev_key_' + crypto.randomBytes(8).toString('hex');

    await db.query(
      `INSERT INTO api_keys (client_name, api_key, scope, created_at, is_revoked)
       VALUES (?, ?, ?, NOW(), false)`,
      [client_name || 'AR Client', apiKey, 'read:featured']
    );

    res.status(201).json({
      message: 'API key generated successfully',
      apiKey
    });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'Failed to generate API key' });
  }
};

exports.getApiKeys = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, client_name, scope, created_at, is_revoked
       FROM api_keys
       ORDER BY created_at DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};