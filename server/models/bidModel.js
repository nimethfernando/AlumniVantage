const pool = require('../config/db');

class Bid {
  // Check how many features the user won this month
  static async getMonthlyWinCount(userId) {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as count FROM featured_profiles 
      WHERE user_id = ? AND MONTH(won_date) = MONTH(CURRENT_DATE()) AND YEAR(won_date) = YEAR(CURRENT_DATE())
    `, [userId]);
    return rows[0].count;
  }

  // Place a new blind bid
  static async placeBid(userId, amount) {
    const [result] = await pool.execute(
      'INSERT INTO bids (user_id, bid_amount) VALUES (?, ?)',
      [userId, amount]
    );
    return result.insertId;
  }

  // Find existing pending bid for a user
  static async getPendingBidByUser(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM bids WHERE user_id = ? AND status = "pending"',
      [userId]
    );
    return rows[0];
  }

  // Update a bid (only if the new amount is higher)
  static async increaseBid(bidId, newAmount) {
    const [result] = await pool.execute(
      'UPDATE bids SET bid_amount = ? WHERE id = ? AND bid_amount < ? AND status = "pending"',
      [newAmount, bidId, newAmount]
    );
    return result.affectedRows > 0;
  }
}
module.exports = Bid;