const pool = require('../config/db');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async create(email, passwordHash, verificationToken) {
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, verification_token) VALUES (?, ?, ?)',
      [email, passwordHash, verificationToken]
    );
    return result.insertId;
  }
}

module.exports = User;