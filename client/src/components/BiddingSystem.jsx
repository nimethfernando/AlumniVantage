import React, { useState, useEffect } from 'react';
import './BiddingSystem.css';

const BiddingSystem = () => {
  const [currentBid, setCurrentBid] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [remainingSlots, setRemainingSlots] = useState(3); 
  const token = localStorage.getItem('token'); 

  useEffect(() => {
    fetchBidStatus();
  }, []);

  const fetchBidStatus = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/bids/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        if (data.current_bid === "No active bids") {
          setCurrentBid(null);
        } else {
          setCurrentBid(data.current_bid);
        }
        
        const used = data.features_used || 0;
        setRemainingSlots(Math.max(0, 3 - used));
      }
    } catch (error) {
      console.error('Error fetching bid:', error);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(bidAmount) })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.message || data.error });
      } else {
        setMessage({ type: 'success', text: data.message });
        setBidAmount('');
        fetchBidStatus(); // Refresh the current bid display
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bidding-container">
      <div className="bidding-header">
        <h2>Feature Your Profile</h2>
        <p>Blind bid to be displayed at the top of the Alumni board.</p>
        
        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '5px', display: 'inline-block' }}>
          <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 'bold' }}>
            Features Remaining This Month: <span style={{ color: remainingSlots === 0 ? 'red' : 'green'}}>{remainingSlots} / 3</span>
          </span>
        </div>

      </div>

      <div className="status-card">
        {currentBid ? (
          <>
            <span className={`status-badge status-${currentBid.status}`}>
              {currentBid.status.toUpperCase()}
            </span>
            <p style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>Your Current Bid</p>
            <h3 className="bid-amount-display">${parseFloat(currentBid.bid_amount).toFixed(2)}</h3>
          </>
        ) : (
          <>
            <span className="status-badge status-none">NO ACTIVE BIDS</span>
            <p style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
              Place a bid to participate in tonight's auction!
            </p>
          </>
        )}
      </div>

      <form className="bidding-form" onSubmit={handlePlaceBid}>
        <div className="input-group">
          <label htmlFor="amount">
            {currentBid ? 'Increase Bid Amount' : 'Enter Bid Amount'}
          </label>
          <div className="currency-input">
            <span className="currency-symbol">$</span>
            <input
              type="number"
              id="amount"
              min="0.01"
              step="0.01"
              placeholder={currentBid ? "Must be higher than current" : "0.00"}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
              disabled={remainingSlots === 0}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading || remainingSlots === 0}>
          {remainingSlots === 0 ? 'Monthly Limit Reached' : (loading ? 'Processing...' : (currentBid ? 'Increase Bid' : 'Place Blind Bid'))}
        </button>
      </form>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default BiddingSystem;