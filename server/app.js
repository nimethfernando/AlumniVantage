require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// 1. IMPORT NEW SECURITY PACKAGES
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

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
// UPGRADED HELMET: Content Security Policy (CSP)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"], 
            styleSrc: ["'self'", "'unsafe-inline'"], 
            imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:5173"], 
            connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies (CRITICAL: Must come before csurf)

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

// SECURITY: CSRF PROTECTION & RATE LIMITING
// CSRF Protection Middleware
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    } 
});

// Apply CSRF to all routes below (GET requests pass freely, POST/PUT/DELETE require a token)
app.use(csrfProtection);

// Endpoint for the React frontend to grab the CSRF token
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Rate Limiter for Sensitive Endpoints
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});


// ==========================================
// 2. ROUTES
// ==========================================
// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

app.use('/api/auth', authRoutes); // Auth Routes
app.use('/api/profile', apiLimiter, profileRoutes); // 👈 Protected by Rate Limiter
app.use('/api/bids', apiLimiter, bidRoutes); // 👈 Protected by Rate Limiter
app.use('/api/public', publicRoutes); // Public Routes (e.g., featured alumnus)

// ==========================================
// CSRF ERROR HANDLER (Makes errors look clean)
// ==========================================
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  // Handle CSRF token errors
  res.status(403).json({ error: 'Form tampered with or session expired. Invalid CSRF token.' });
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