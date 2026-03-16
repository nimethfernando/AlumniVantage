import { Link } from 'react-router-dom';
import '../App.css'; // Make sure this imports your CSS

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to AlumniVantage</h1>
          <p>Your portal to connect, collaborate, and grow with your professional alumni network.</p>
          <div className="home-buttons">
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/register" className="btn-secondary">Create an Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;