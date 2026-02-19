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
  static async findByToken(token) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE verification_token = ?', [token]);
    return rows[0];
  }
  static async verifyUser(id) {
    await pool.execute('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [id]);
  }
  // Password Reset Methods (1 hour expiry)
  static async saveResetToken(email, token) {
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await pool.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?',
      [token, expires, email]
    );
  }
  // Find user by reset token and check if it's still valid
  static async findByResetToken(token) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );
    return rows[0];
  }
  // Update password and clear reset token
  static async resetPassword(id, newPasswordHash) {
    await pool.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [newPasswordHash, id]
    );
  }
}
module.exports = User;