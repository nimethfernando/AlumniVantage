require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const apiKeyRoutes = require('./routes/apiKeyRoutes');

// Swagger Documentation
const swaggerUi = require('swagger-ui-express');

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

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

// ==========================================
// 1. GLOBAL MIDDLEWARE
// ==========================================
// UPGRADED HELMET: Content Security Policy (CSP)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], 
            styleSrc: ["'self'", "'unsafe-inline'"], 
            imgSrc: ["'self'", 'data:', FRONTEND_URL, BACKEND_URL].filter(Boolean), 
            connectSrc: ["'self'", FRONTEND_URL, BACKEND_URL].filter(Boolean),
            fontSrc: ["'self'", 'https:', 'data:'],
            objectSrc: ["'none'"],
            frameAncestors: ["'self'"]
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); 

// CORS setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / Swagger / server-to-server

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true 
}));

app.use(morgan('dev'));  

// Serve uploaded images and static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
// Load swagger dynamically and replace localhost URL
const swaggerPath = path.join(__dirname, 'swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));

if (swaggerDocument.servers && swaggerDocument.servers.length > 0) {
  swaggerDocument.servers[0].url = BACKEND_URL || `http://localhost:${PORT}`;
}

// Serve the Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    withCredentials: true
  }
}));

// Basic Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the AlumniVantage API' });
});

app.use('/api/auth', authRoutes); 
app.use('/api/profile', apiLimiter, profileRoutes); // Protected by Rate Limiter
app.use('/api/bids', apiLimiter, bidRoutes); // Protected by Rate Limiter
app.use('/api/public', publicRoutes); // Public Developer API
app.use('/api/dev', apiKeyRoutes); // API Key Management Routes

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
app.listen(PORT, async () => {
  try {
    await db.query('SELECT 1');
    console.log(`Database Connected & Server running on port ${PORT}`);
    console.log(`Frontend URL: ${FRONTEND_URL}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
  } catch (err) {
    console.error(' Database Connection Failed:', err.message);
  }
});