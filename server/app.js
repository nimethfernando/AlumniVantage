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
const publicRoutes = require('./routes/publicRoutes'); // For the featured alumnus endpoint

// Import Database and Background Jobs
const db = require('./config/db'); 
require('./utils/cronJobs'); // Starts the background bidding worker

// IMPORT YOUR NEW API LOGGER MIDDLEWARE
const apiLogger = require('./middleware/apiLogger');

// Initialize App
const app = express();

// ==========================================
// 1. MIDDLEWARE (Must come BEFORE routes)
// ==========================================
app.use(helmet());       // Secure HTTP headers (Best practice: put Helmet as high up as possible)

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies (Good practice for standard form submissions)


app.use(cookieParser()); // Parse cookies

// CORS setup
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true // Allow cookies to be sent
}));

app.use(morgan('dev'));  // Log requests to console

// Serve uploaded images from the "public/uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static('public')); // Serve static files from "public" directory

// APPLY THE GLOBAL API LOGGER HERE
app.use(apiLogger);

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
app.use('/api/public', publicRoutes); // Public Routes (e.g., featured alumnus)

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