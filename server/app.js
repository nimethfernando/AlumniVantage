require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bidRoutes = require('./routes/bidRoutes');

// Import Database and Background Jobs
const db = require('./config/db'); 
require('./utils/cronJobs'); // Starts the background bidding worker

// Initialize App
const app = express();

// ==========================================
// 1. MIDDLEWARE (Must come BEFORE routes)
// ==========================================
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// CORS setup
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true // Allow cookies to be sent
}));

app.use(helmet());       // Secure HTTP headers
app.use(morgan('dev'));  // Log requests to console

// Serve uploaded images from the "public/uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static('public')); // Serve static files from "public" directory

// ==========================================
// 2. ROUTES
// ==========================================
// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

app.use('/api/auth', authRoutes); // Auth Routes
app.use('/api/profile', profileRoutes); // Profile Routes
app.use('/api/bids', bidRoutes); // Bid Routes

// ==========================================
// 3. START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    // Test DB Connection
    await db.query('SELECT 1');
    console.log(`Database Connected & Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error(' Database Connection Failed:', err.message);
  }
});