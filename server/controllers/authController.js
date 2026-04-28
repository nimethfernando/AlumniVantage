const bcrypt = require('bcrypt'); // Used for securely hashing passwords
const crypto = require('crypto'); // Built-in Node module for generating secure random tokens
const User = require('../models/userModel'); // Database operations for the User entity
const jwt = require('jsonwebtoken'); // Generates and verifies JSON Web Tokens for sessions
const { sendVerificationEmail, sendResetEmail } = require('../utils/emailService'); // Custom email service
const pool = require('../config/db'); // Raw database connection pool for the blacklist query

// 1. REGISTER NEW USER

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // SECURITY: Check if User Already Exists to prevent duplicate accounts
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // SECURITY: Hash the Password
    // saltRounds = 10 dictates how computationally expensive the hashing is. 
    // This protects against brute-force and rainbow table attacks.
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate Verification Token (A random 64-character hex string)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Set the token to expire 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save the new user to the Database with the hashed password and token
    await User.create(email, passwordHash, verificationToken, expiresAt);

    // ==========================================
    // ACTION 1: DEV PRINT TOKEN (LIKE RESET TOKEN)
    // ==========================================
    // Only prints the token to the terminal if NOT in a live production environment.
    // Useful for testing with tools like Postman without having to check your real email.
    if (process.env.NODE_ENV !== 'production') {
        console.log("\n============================================");
        console.log(`🔑 DEV VERIFY TOKEN FOR ${email}:`);
        console.log(verificationToken);
        console.log("============================================\n");
    }

    // ==========================================
    // ACTION 2: SEND EMAIL
    // ==========================================
    // Dispatches the verification email containing the token link
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: "Registration successful! Please verify your email."
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. LOGIN USER

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists in the database
    const user = await User.findByEmail(email);
    if (!user) {
      // SECURITY: Generic error message so attackers can't guess valid emails
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // SECURITY: Compare the plaintext password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if Email is Verified before allowing login
    if (!user.is_verified) {
       return res.status(403).json({ error: "Please verify your email address first." });
    }

    // SECURITY: Generate JWT Token (The "Digital ID Card")
    // This token proves who the user is for subsequent API requests
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Payload (Non-sensitive data inside the token)
      process.env.JWT_SECRET,               // Secret Key (from .env) used to digitally sign the token
      { expiresIn: '1h' }                   // Token expires in 1 hour for security
    );

    // SECURITY: Store the JWT in an HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true, // Prevents client-side Javascript (XSS) from stealing the token
      secure: process.env.NODE_ENV === 'production', // Cookie is only sent over HTTPS in production
      sameSite: 'strict', // Prevents Cross-Site Request Forgery (CSRF)
      maxAge: 3600000 // Cookie lifespan: 1 hour (matches the JWT expiry)
    });

    // Send Success Response (Includes the token in the JSON body just in case 
    // the frontend needs it for headers, though cookies are the primary method here)
    res.json({ 
      message: "Login successful", 
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 3. LOGOUT USER

exports.logout = async (req, res) => {
  try {
    // Attempt to extract the token from the cookie OR the Authorization header
    const token = 
      req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    // SECURITY: Token Blacklisting
    // Because JWTs are stateless, they can't easily be "destroyed" server-side before they expire.
    // By adding the token to a database blacklist, your auth middleware can reject it 
    // even if the 1-hour expiration time hasn't passed yet.
    if (token) {
      await pool.execute(
        'INSERT IGNORE INTO token_blacklist (token) VALUES (?)', 
        [token]
      );
    }

    // Instruct the user's browser to delete the cookie
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Error during logout" });
  }
};

// 4. VERIFY EMAIL

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find the user associated with this exact verification token
    const user = await User.findByToken(token);

    if (!user) {
      return res.status(400).json({ error: "Invalid token." });
    }

    // Check if the 24-hour window has expired
    const currentTime = new Date();
    const expirationTime = new Date(user.verification_expires_at);

    if (currentTime > expirationTime) {
      return res.status(400).json({ error: "Verification link has expired. Please request a new one." });
    }

    // Update the database: set is_verified to true and clear the token
    await User.verifyUser(user.id);

    // Send a simple HTML response since this is usually triggered directly by clicking an email link
    res.send("<h1>Email Verified! ✅</h1><p>You can now close this tab and log in.</p>");

  } catch (error) {
    console.error(error);
    res.status(500).send("Error verifying email.");
  }
};

// 5. REQUEST PASSWORD RESET
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    // SECURITY BEST PRACTICE: Standardize the message so attackers can't guess 
    // which emails are registered in your database (User Enumeration Prevention).
    const standardMessage = "If that email exists, a reset link has been sent.";

    // If the user doesn't exist, silently return success anyway.
    if (!user) {
      return res.json({ message: standardMessage });
    }

    // Generate a secure, single-use token
    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.saveResetToken(email, resetToken);

    // ==========================================
    // ACTION 1: THE DEV HACK (Print to console)
    // ==========================================
    if (process.env.NODE_ENV !== 'production') {
        console.log("\n============================================");
        console.log(`🔑 DEV RESET TOKEN FOR ${email}:`);
        console.log(resetToken);
        console.log("============================================\n");
    }

    // ==========================================
    // ACTION 2: THE REAL FEATURE (Send the email)
    // ==========================================
    await sendResetEmail(email, resetToken);

    // Always return the standard message
    res.json({ message: standardMessage });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// 6. EXECUTE PASSWORD RESET

exports.resetPassword = async (req, res) => {
  try {
    // Extract token from URL params or JSON body
    const token = req.params.token || req.body.token; 
    const { newPassword } = req.body;

    const user = await User.findByResetToken(token);
    
    // If the token is invalid or the time has expired (checked in model), reject.
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash the brand new password before saving
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update the database with the new password hash and clear the reset token
    await User.resetPassword(user.id, hash);

    res.json({ message: "Password successfully reset! You can now login." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};