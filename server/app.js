require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Security Packages
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const bidRoutes = require('./routes/bidRoutes');
const publicRoutes = require('./routes/publicRoutes'); 

// Import Database and Background Jobs
const db = require('./config/db'); 
require('./utils/cronJobs'); 

// Import Global API Logger
const apiLogger = require('./middleware/apiLogger');

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARE
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

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// CORS setup
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true 
}));

app.use(morgan('dev'));  

// Serve uploaded images and static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static('public')); 

app.use(apiLogger);

// ==========================================
// 2. SECURITY: CSRF PROTECTION & RATE LIMITING
// ==========================================
// CSRF Protection Middleware
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    } 
});

app.use(csrfProtection);

// Endpoint for React to grab the CSRF token
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
// 3. ROUTES & SWAGGER
// ==========================================
// Serve the Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

app.use('/api/auth', authRoutes); 
app.use('/api/profile', apiLimiter, profileRoutes); // Protected by Rate Limiter
app.use('/api/bids', apiLimiter, bidRoutes); // Protected by Rate Limiter
app.use('/api/public', publicRoutes); // Public Developer API

// ==========================================
// 4. ERROR HANDLING
// ==========================================
// CSRF Error Handler
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).json({ error: 'Form tampered with or session expired. Invalid CSRF token.' });
});

// ==========================================
// 5. START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log(`Database Connected & Server running on http://localhost:${PORT}`);
  } catch (err) {
    console.error(' Database Connection Failed:', err.message);
  }
});