import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams(); // Grabs token from URL
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:3000/api/auth/reset-password/${token}`, { newPassword: password });
      alert('Password Reset Successful! logging you in...');
      navigate('/login');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error resetting password');
    }
  };

  return (
    <div className="container">
      <h2>Reset Password</h2>
      {message && <p style={{color:'red'}}>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="password" 
          placeholder="New Password" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">Change Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;