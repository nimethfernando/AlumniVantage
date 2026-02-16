const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
// Initialize App
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Allow cross-origin requests
app.use(helmet());       // Secure HTTP headers
app.use(morgan('dev'));  // Log requests to console
app.use('/api/auth', authRoutes); // Auth Routes

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