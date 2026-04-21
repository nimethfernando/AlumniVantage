// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../App.css';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to AlumniVantage</h1>
          <p>Your portal to connect, collaborate, and grow with your professional alumni network.</p>

          <div className="home-buttons">
            {!user ? (
              <>
                <Link to="/login" className="btn-primary">Sign In</Link>
                <Link to="/register" className="btn-secondary">Create an Account</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="btn-primary">University Analytics Dashboard</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;