// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../App.css'; // Make sure this imports your CSS

const Home = () => {
  const { user } = useContext(AuthContext); // Bring in the auth context to check if logged in

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to AlumniVantage</h1>
          <p>Your portal to connect, collaborate, and grow with your professional alumni network.</p>
          <div className="home-buttons">
            {/* If user is NOT logged in, show Sign In / Register */}
            {!user ? (
              <>
                <Link to="/login" className="btn-primary">Sign In</Link>
                <Link to="/register" className="btn-secondary">Create an Account</Link>
              </>
            ) : (
              /* If user IS logged in, show Profile / Dashboard links */
              <>
                <Link to="/profile" className="btn-primary">My Profile</Link>
                <Link to="/dashboard" className="btn-secondary">University Analytics Dashboard</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;