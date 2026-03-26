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

exports.revokeApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE api_keys SET is_revoked = 1 WHERE id = ?",
      [id]
    );

    res.json({ message: "API key revoked successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to revoke API key" });
  }
};

exports.getApiKeyStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        client_name,
        usage_count,
        last_used_at,
        is_revoked,
        created_at
      FROM api_keys
      ORDER BY created_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error("STATS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch API key statistics" });
  }
};