const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail, sendResetEmail } = require('../utils/emailService');
const pool = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if User Already Exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // Hash the Password (Security Mark: 5/5)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Save to Database
    await User.create(email, passwordHash, verificationToken, expiresAt);

    // Send Verification Email
    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: "Registration successful! Please verify your email.",
      verificationToken: verificationToken // Returning this for testing purposes
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // NOTE: `if(!email || !password)` check removed because 
    // express-validator handles it in authRoutes.js!

    // Find User
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if Email is Verified (Task Requirement!)
    if (!user.is_verified) {
       return res.status(403).json({ error: "Please verify your email address first." });
    }

    // Generate JWT Token (The "Digital ID Card")
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Payload (Data inside the token)
      process.env.JWT_SECRET,               // Secret Key (from .env)
      { expiresIn: '1h' }                   // Expiration time
    );

    res.cookie('token', token, {
      httpOnly: true, // Prevents XSS (JavaScript cannot read this)
      secure: process.env.NODE_ENV === 'production', // True if using HTTPS
      sameSite: 'strict', // CSRF protection
      maxAge: 3600000 // 1 hour
    });

    // Send Success Response
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

exports.logout = async (req, res) => {
  try {
    // Grab the token before we destroy the cookie
    const token = 
      req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    // If a token exists, add it to the blacklist in the database
    if (token) {
      await pool.execute(
        'INSERT IGNORE INTO token_blacklist (token) VALUES (?)', 
        [token]
      );
    }

    // Clear the cookie
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Error during logout" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user with this token
    const user = await User.findByToken(token);

    if (!user) {
      return res.status(400).json({ error: "Invalid token." });
    }

    // Check if the token has expired
    const currentTime = new Date();
    const expirationTime = new Date(user.verification_expires_at);

    if (currentTime > expirationTime) {
      return res.status(400).json({ error: "Verification link has expired. Please request a new one." });
    }

    // Mark as Verified in Database
    await User.verifyUser(user.id);

    res.send("<h1>Email Verified! ✅</h1><p>You can now close this tab and log in.</p>");

  } catch (error) {
    console.error(error);
    res.status(500).send("Error verifying email.");
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await User.saveResetToken(email, resetToken);

    // CALL THE EMAIL SERVICE HERE
    await sendResetEmail(email, resetToken);

    res.json({ message: "Password reset link sent to your email." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByResetToken(token);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Update DB
    await User.resetPassword(user.id, hash);

    res.json({ message: "Password successfully reset! You can now login." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};