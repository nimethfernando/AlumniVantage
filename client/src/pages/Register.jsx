import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../App.css'; 

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post('http://localhost:3000/api/auth/register', { email, password });
      setSuccess('Success! Check your terminal (or email) for the verification link.');
      setEmail(''); // Clear the form on success
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create an Account</h2>
        <p className="auth-subtitle">Join AlumniVantage today</p>
        
        {/* Display Error or Success messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="you@my.westminster.ac.uk" 
              value={email}
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          
          <button type="submit" className="btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>Already have an account? <Link to="/login" className="text-link font-bold">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;