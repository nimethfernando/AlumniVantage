const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
// Initialize App
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Allow cross-origin requests
app.use(helmet());       // Secure HTTP headers
app.use(morgan('dev'));  // Log requests to console
app.use('/api/auth', authRoutes); // Auth Routes
app.use(cookieParser()); // Parse cookies
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true // Allow cookies to be sent
}));

// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

// Import Database Connection (just to test it works)
const db = require('./config/db');

// Start Server
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