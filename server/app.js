const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const db = require('./config/db'); // Moved import to the top

// Initialize App
const app = express();

// 1. MIDDLEWARE (Must come BEFORE routes)
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// CORS setup: Removed the trailing "/" from the origin!
app.use(cors({
  origin: 'http://localhost:5172', // Frontend URL
  credentials: true // Allow cookies to be sent
}));

app.use(helmet());       // Secure HTTP headers
app.use(morgan('dev'));  // Log requests to console

// 2. ROUTES
app.use('/api/auth', authRoutes); // Auth Routes

// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

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