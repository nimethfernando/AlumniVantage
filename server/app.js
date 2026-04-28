// ENVIRONMENT & CORE DEPENDENCIES
// Load environment variables from a .env file into process.env (Crucial for security)
require('dotenv').config();

// Import core Express framework and path/fs modules for file system operations
const express = require('express');
const path = require('path');
const fs = require('fs');

// ==========================================
// MIDDLEWARE DEPENDENCIES
// ==========================================
const cors = require('cors'); // Allows cross-origin requests (e.g., frontend talking to backend)
const helmet = require('helmet'); // Secures Express apps by setting various HTTP headers
const morgan = require('morgan'); // Logs HTTP requests to the console for debugging
const cookieParser = require('cookie-parser'); // Parses cookies attached to incoming client requests

// Swagger Documentation for API endpoint visualization
const swaggerUi = require('swagger-ui-express');

// Security Packages
const rateLimit = require('express-rate-limit'); // Prevents brute-force attacks by limiting request rates
const csrf = require('csurf'); // Prevents Cross-Site Request Forgery attacks

// ==========================================
// ROUTE IMPORTS
// ==========================================
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bidRoutes = require('./routes/bidRoutes');
const publicRoutes = require('./routes/publicRoutes'); 
const analyticsRoutes = require('./routes/analyticsRoutes');
const alumniRoutes = require('./routes/alumniRoutes'); 

// Import Database configuration and background tasks (cron jobs)
const db = require('./config/db'); 
require('./utils/cronJobs'); 

// Custom middleware to log API requests for your own analytics
const apiLogger = require('./middleware/apiLogger');

// Initialize the Express application
const app = express();

// Set up configuration variables from environment variables
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;
// Parse the ALLOWED_ORIGINS string into an array of URLs for CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// ==========================================
// 1. GLOBAL MIDDLEWARE
// ==========================================
// UPGRADED HELMET: Content Security Policy (CSP)
// Defines which dynamic resources are allowed to load, preventing XSS (Cross-Site Scripting)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // Only allow resources from the same origin
            scriptSrc: ["'self'", "'unsafe-inline'"], // Scripts allowed from self and inline
            styleSrc: ["'self'", "'unsafe-inline'"], // Styles allowed from self and inline
            // Images allowed from self, data URIs, and your specific URLs
            imgSrc: ["'self'", 'data:', FRONTEND_URL, BACKEND_URL].filter(Boolean), 
            // Connections (fetches/AJAX) allowed to your specific URLs
            connectSrc: ["'self'", FRONTEND_URL, BACKEND_URL].filter(Boolean),
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"], // Disallow risky object tags (Flash, Java)
            frameAncestors: ["'self'"] // Prevent clickjacking
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Parsers for incoming request bodies
app.use(express.json()); // Parses application/json data
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data (HTML forms)
app.use(cookieParser()); // Populates req.cookies

// CORS setup: Decides who is allowed to make requests to this API
app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server requests or tools like Postman (no origin)
    if (!origin) return callback(null, true); 

    // Check if the requester's origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true // Crucial: Allows the frontend to send cookies (like CSRF tokens)
}));

// Request logging in 'dev' format
app.use(morgan('dev'));  

// Serve static directories globally
// Maps the '/uploads' URL to the physical 'uploads' folder on the server
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public')); // Serves static files in the public folder
// Attach custom API logger
app.use(apiLogger);

// ==========================================
// 2. SECURITY: CSRF PROTECTION & RATE LIMITING
// ==========================================
// CSRF Protection Middleware
// Generates a token that MUST be passed with state-changing requests (POST, PUT, DELETE)
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true, // Javascript cannot access this cookie directly
        secure: process.env.NODE_ENV === 'production', // Use HTTPS only in production
        sameSite: 'strict' // Do not send cookie on cross-site requests
    } 
});

// Apply CSRF universally
app.use(csrfProtection);

// Endpoint for React frontend to fetch the active CSRF token
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Rate Limiter to prevent DoS attacks on sensitive routes
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 100, // Limit each IP to 100 requests per 15 minutes
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// ==========================================
// 3. ROUTES & SWAGGER
// ==========================================
// Load swagger dynamically and update the base URL so testing works in all environments
const swaggerPath = path.join(__dirname, 'swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

if (swaggerDocument.servers && swaggerDocument.servers.length > 0) {
  swaggerDocument.servers[0].url = BACKEND_URL || `http://localhost:${PORT}`;
}

// Serve the Swagger UI Documentation at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    withCredentials: true // Ensure Swagger can send the CSRF cookie when testing
  }
}));

// Basic Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

// Map routers to endpoint prefixes
app.use('/api/auth', authRoutes); 
app.use('/api/profile', apiLimiter, profileRoutes); // Rate limited to prevent scraping/spam
app.use('/api/bids', apiLimiter, bidRoutes); // Rate limited
app.use('/api/public', publicRoutes); 
app.use('/api/dev', apiKeyRoutes); 
app.use('/api/analytics', apiLimiter, analyticsRoutes); 
app.use('/api/alumni', apiLimiter, alumniRoutes); 

// ==========================================
// 4. ERROR HANDLING
// ==========================================
// Global error handler specifically looking for CSRF failures
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err); // If it's not a CSRF error, pass it on
  // Respond with a 403 Forbidden if CSRF token is missing or invalid
  res.status(403).json({ error: 'Form tampered with or session expired. Invalid CSRF token.' });
});

// ==========================================
// 5. START SERVER
// ==========================================
app.listen(PORT, async () => {
  try {
    // Ping the database to ensure the connection is alive before saying "Running"
    await db.query('SELECT 1');
    console.log(`Database Connected & Server running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
  } catch (err) {
    console.error(' Database Connection Failed:', err.message);
  }
});