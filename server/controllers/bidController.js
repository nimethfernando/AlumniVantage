const Bid = require('../models/bidModel');
const pool = require('../config/db'); // Added to run custom queries for status & limits

exports.placeOrUpdateBid = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.userId; 

  // Make sure amount was provided
  if (!amount) {
    return res.status(400).json({ error: "Please provide a bid amount." });
  }

  try {
    // 1. Check if user attended an event to determine their monthly limit (3 or 4)
    const [userRows] = await pool.execute('SELECT attended_event FROM users WHERE id = ?', [userId]);
    const attendedEvent = userRows.length > 0 && userRows[0].attended_event ? true : false;
    const maxBids = attendedEvent ? 4 : 3;

    // 2. Enforce the dynamic limit
    const winCount = await Bid.getMonthlyWinCount(userId);
    if (winCount >= maxBids) {
      return res.status(403).json({ message: `Monthly limit of ${maxBids} features reached.` });
    }

    const existingBid = await Bid.getPendingBidByUser(userId);

    if (existingBid) {
      if (amount <= existingBid.bid_amount) {
        return res.status(400).json({ message: "New bid must be higher than your current bid." });
      }
      
      const updated = await Bid.increaseBid(existingBid.id, amount);
      if (updated) {
        return res.status(200).json({ message: "Bid increased successfully." });
      }
    } else {
      await Bid.placeBid(userId, amount);
      return res.status(201).json({ message: "Blind bid placed successfully." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBidStatus = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const existingBid = await Bid.getPendingBidByUser(userId);
    const winCount = await Bid.getMonthlyWinCount(userId);
    
    // 1. Calculate max features for the UI display
    const [userRows] = await pool.execute('SELECT attended_event FROM users WHERE id = ?', [userId]);
    const attendedEvent = userRows.length > 0 && userRows[0].attended_event ? true : false;
    const maxBids = attendedEvent ? 4 : 3;

    // 2. Check if the user is currently the highest bidder (Winning/Losing feedback)
    let isWinning = false;
    if (existingBid) {
      const [highestBid] = await pool.execute(
          'SELECT MAX(bid_amount) as max_bid FROM bids WHERE status = "pending"'
      );
      
      if (highestBid[0].max_bid && parseFloat(existingBid.bid_amount) >= parseFloat(highestBid[0].max_bid)) {
          isWinning = true;
      }
    }

    res.status(200).json({ 
      current_bid: existingBid ? { ...existingBid, isWinning } : "No active bids",
      features_used : winCount,
      max_features: maxBids // Send max limit to the frontend
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBidHistory = async (req, res) => {
  const userId = req.user.userId;

  try {
    const history = await Bid.getBidHistoryByUser(userId);
    res.status(200).json({
      message: "Bidding history retrieved successfully",
      history: history
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBid = async (req, res) => {
  const userId = req.user.userId;

  try {
    // First, check if they actually have a pending bid
    const existingBid = await Bid.getPendingBidByUser(userId);

    if (!existingBid) {
      return res.status(404).json({ message: "No active pending bid found to cancel." });
    }

    // Cancel the bid
    const isCanceled = await Bid.cancelBid(existingBid.id, userId);

    if (isCanceled) {
      res.status(200).json({ message: "Bid canceled successfully." });
    } else {
      res.status(400).json({ message: "Could not cancel bid. It may have already been processed." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};