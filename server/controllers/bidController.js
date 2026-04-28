// Import the Bid model for database operations related specifically to bids
const Bid = require('../models/bidModel');
// Import the raw database pool to run custom queries (like checking user status and max bids)
const pool = require('../config/db'); 

// 1. GET TOMORROW'S SLOT INFO
/**
 * Determines the status of the bidding slot for the next available day.
 * Bidding for 'tomorrow' closes at 6:00 PM today.
 */
exports.getTomorrowSlot = async (req, res) => {
  const userId = req.user.userId;

  try {
    const now = new Date();
    
    // Create a cutoff time set to 18:00:00 (6:00 PM) of the current day
    const cutoff = new Date(now);
    cutoff.setHours(18, 0, 0, 0);

    let slotDate = new Date(now);

    // Determine which day the user is actually bidding for based on the time
    if (now >= cutoff) {
      // If it is past 6 PM, the slot for tomorrow is finalized. 
      // Bids placed now are for the DAY AFTER tomorrow.
      slotDate.setDate(slotDate.getDate() + 2);
    } else {
      // If it is before 6 PM, bids are for TOMORROW.
      slotDate.setDate(slotDate.getDate() + 1);
    }

    // Format the date for the database (YYYY-MM-DD)
    const slot_date = slotDate.toISOString().split('T')[0];
    const cutoffTime = cutoff.toISOString();

    // Check if the user already has a pending bid in the system
    const existingBid = await Bid.getPendingBidByUser(userId);

    // Get how many times the user has already won a slot this month
    const winCount = await Bid.getMonthlyWinCount(userId);

    // Check if the user attended a university event. 
    // This acts as a reward system, giving them a higher monthly bidding limit.
    const [userRows] = await pool.execute(
      'SELECT attended_event FROM users WHERE id = ?',
      [userId]
    );

    const attendedEvent = userRows.length > 0 && userRows[0].attended_event ? true : false;
    
    // Dynamic Limits: 4 feature wins if they attended an event, otherwise 3.
    const maxBids = attendedEvent ? 4 : 3;

    // The slot is only accepting bids BEFORE the 6 PM cutoff
    const isOpen = now < cutoff;

    return res.status(200).json({
      slot_date: slot_date,
      bidding_closes_at: cutoffTime,
      slot_status: isOpen ? 'open' : 'closed',
      already_bid: !!existingBid, // Boolean true/false if they have a bid
      current_bid: existingBid
        ? { // Only send non-sensitive bid details to the frontend
            id: existingBid.id,
            bid_amount: existingBid.bid_amount,
            status: existingBid.status,
            created_at: existingBid.created_at,
            updated_at: existingBid.updated_at
          }
        : null,
      features_used: winCount,
      max_features: maxBids,
      remaining_features: Math.max(maxBids - winCount, 0),
      message: isOpen
        ? 'Bidding is open for tomorrow’s featured alumni slot.'
        : 'Bidding for tomorrow’s slot is closed after 6:00 PM.'
    });
  } catch (error) {
    console.error('Get tomorrow slot error:', error);
    res.status(500).json({ error: 'Failed to fetch tomorrow slot details' });
  }
};


// 2. PLACE OR UPDATE A BLIND BID
/**
 * Allows a user to place a new bid or increase their existing bid.
 */
exports.placeOrUpdateBid = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.userId; 

  // Basic validation
  if (!amount) {
    return res.status(400).json({ error: "Please provide a bid amount." });
  }

  try {
    // 1. Calculate user's monthly win limit based on event attendance
    const [userRows] = await pool.execute('SELECT attended_event FROM users WHERE id = ?', [userId]);
    const attendedEvent = userRows.length > 0 && userRows[0].attended_event ? true : false;
    const maxBids = attendedEvent ? 4 : 3;

    // 2. Enforce the monthly win limit
    const winCount = await Bid.getMonthlyWinCount(userId);
    if (winCount >= maxBids) {
      return res.status(403).json({ message: `Monthly limit of ${maxBids} features reached.` });
    }

    // Check if the user already has a bid for the current slot
    const existingBid = await Bid.getPendingBidByUser(userId);

    if (existingBid) {
      // Users can only INCREASE their bids in an auction, never decrease them
      if (parseFloat(amount) <= parseFloat(existingBid.bid_amount)) {
        return res.status(400).json({ message: "New bid must be higher than your current bid." });
      }
      
      const updated = await Bid.increaseBid(existingBid.id, amount);
      if (updated) {
        return res.status(200).json({ message: "Bid increased successfully." });
      }
      return res.status(400).json({ message: "Unable to increase bid." });
    } else {
      // Place a brand new bid
      await Bid.placeBid(userId, amount);
      return res.status(201).json({ message: "Blind bid placed successfully." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. GET CURRENT BID STATUS (WINNING/LOSING)
/**
 * Fetches the user's active bid and calculates if they are currently the highest bidder.
 * This is a "Blind" auction, so it does NOT return the actual highest bid amount,
 * only a boolean telling the user if they are winning or losing.
 */
exports.getBidStatus = async (req, res) => {
  const userId = req.user.userId;
  
  try {
    const existingBid = await Bid.getPendingBidByUser(userId);
    const winCount = await Bid.getMonthlyWinCount(userId);
    
    // 1. Calculate max features for the UI display limits
    const [userRows] = await pool.execute('SELECT attended_event FROM users WHERE id = ?', [userId]);
    const attendedEvent = userRows.length > 0 && userRows[0].attended_event ? true : false;
    const maxBids = attendedEvent ? 4 : 3;

    // 2. Determine if the user is the top bidder
    let isWinning = false;
    let bidStatus = "not winning";
    if (existingBid) {
      // Find the absolute highest bid currently in the pending pool
      const [highestBid] = await pool.execute(
          'SELECT MAX(bid_amount) as max_bid FROM bids WHERE status = "pending"'
      );
      
      const maxBid = highestBid[0].max_bid || 0;
      // If the user's bid is equal to or greater than the max bid, they are winning
      if (maxBid && parseFloat(existingBid.bid_amount) >= parseFloat(maxBid)) {
          isWinning = true;
          bidStatus = "winning";
      }
    }

    res.status(200).json({ 
      current_bid: existingBid ? { id: existingBid.id, user_id: existingBid.user_id, bid_amount: existingBid.bid_amount, created_at: existingBid.created_at, updated_at: existingBid.updated_at } : null,
      bid_status: bidStatus,
      isWinning, // Frontend uses this to show a "You are currently winning!" UI badge
      features_used: winCount,
      max_features: maxBids
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. GET BID HISTORY

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

// 5. CANCEL BID

exports.cancelBid = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Ensure they actually have a pending bid
    const existingBid = await Bid.getPendingBidByUser(userId);

    if (!existingBid) {
      return res.status(404).json({ message: "No active pending bid found to cancel." });
    }

    // Attempt to cancel it (Bid model should set status to 'canceled')
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