import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig'; 
import { useNavigate, Link } from 'react-router-dom';
import '../App.css'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.token); 
      navigate('/profile');  
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to continue to AlumniVantage</p>
        {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@my.westminster.ac.uk" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
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
          <button type="submit" className="btn-primary full-width" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer-links">
          <Link to="/forgot-password" label="Forgot Password" className="text-link">Forgot Password?</Link>
          <p>Don't have an account? <Link to="/register" className="text-link font-bold">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;