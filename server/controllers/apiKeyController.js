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
      `SELECT id, client_name, created_at
       FROM api_keys
       ORDER BY created_at DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE api_keys SET is_revoked = 1 WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
};

// Get API key statistics by ID
exports.getApiKeyStatsById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT 
          id,
          client_name,
          api_key,
          scope,
          is_revoked,
          created_at,
          last_used_at,
          usage_count
       FROM api_keys
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Get API key stats by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch API key statistics' });
  }
};