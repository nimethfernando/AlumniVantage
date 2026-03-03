const Bid = require('../models/bidModel');

exports.placeOrUpdateBid = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user.userId; 

  // Make sure amount was provided
  if (!amount) {
    return res.status(400).json({ error: "Please provide a bid amount." });
  }

  try {
    const winCount = await Bid.getMonthlyWinCount(userId);
    if (winCount >= 3) {
      return res.status(403).json({ message: "Monthly limit of 3 features reached." });
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
    res.status(200).json({ 
      current_bid: existingBid || "No active bids",
      features_used : winCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};