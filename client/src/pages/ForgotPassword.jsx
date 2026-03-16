// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css'; // Make sure CSS is imported

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
      setSuccess(res.data.message || 'Password reset link sent to your email.');
      setEmail(''); // Clear input on success
    } catch (err) {
      setError(err.response?.data?.error || 'Error sending email. Please check your email address.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p className="auth-subtitle">Enter your email to receive a reset link</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="you@my.westminster.ac.uk" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>Remember your password? <Link to="/login" className="text-link font-bold">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;