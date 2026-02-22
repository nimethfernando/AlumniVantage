import { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error sending email Plz check Your Email Address');
    }
  };

  return (
    <div className="container">
      <h2>Forgot Password</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Enter your email" 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;