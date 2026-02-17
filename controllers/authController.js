const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Check for University Domain
    if (!email.endsWith('@westminster.ac.uk')) {
      return res.status(400).json({ error: "Registration restricted to @westminster.ac.uk emails only." });
    }

    // 2. Validation: Check Password Strength (Basic)
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    // 3. Check if User Already Exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered." });
    }

    // 4. Hash the Password (Security Mark: 5/5)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 6. Save to Database
    await User.create(email, passwordHash, verificationToken);

    res.status(201).json({ 
      message: "Registration successful! Please verify your email.",
      verificationToken: verificationToken // Returning this for testing purposes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Check if Email and Password are Provided
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 3. Check if Email is Verified (Task Requirement!)
    // Note: For testing right now, you might want to comment this out 
    // if you haven't manually set 'is_verified' to 1 in your database yet.
    if (!user.is_verified) {
       return res.status(403).json({ error: "Please verify your email address first." });
    }

    // 4. Generate JWT Token (The "Digital ID Card")
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Payload (Data inside the token)
      process.env.JWT_SECRET,               // Secret Key (from .env)
      { expiresIn: '1h' }                   // Expiration time
    );

    // 5. Send Success Response
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