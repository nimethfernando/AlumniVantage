import { useState } from 'react';
import api from '../api/axiosConfig';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../App.css';

const ResetPassword = () => {
  const { token } = useParams(); // Grabs token from URL
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for visibility toggle
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post(`/api/auth/reset-password/${token}`, { newPassword: password });
      setSuccess('Password Reset Successful! Redirecting to login...');
      
      // Give the user a second to read the success message before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && Array.isArray(serverErrors) && serverErrors.length > 0) {
        // Displays the specific reason (e.g., "Password must contain 1 uppercase letter...")
        setError(serverErrors[0].msg);
      } else {
        // Fallback for general errors like expired links
        setError(err.response?.data?.error || 'Error resetting password. The link might be expired.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Set New Password</h2>
        <p className="auth-subtitle">Create a strong new password for your account</p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>New Password</label>
            <input 
              type={showPassword ? "text" : "password"} // Toggle type based on state
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            {/* Show Password Toggle */}
            <div className="show-password-container">
              <input 
                type="checkbox" 
                id="show-password" 
                checked={showPassword} 
                onChange={() => setShowPassword(!showPassword)} 
              />
              <label htmlFor="show-password">Show Password</label>
            </div>
          </div>
          
          <button type="submit" className="btn-primary full-width" disabled={isLoading || success !== ''}>
            {isLoading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
        
        <div className="auth-footer-links">
          <Link to="/login" className="text-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;