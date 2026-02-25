const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // 1. Check if the token is in the cookies OR the Authorization header
    const token = 
      req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    // 2. If no token is found, deny access
    if (!token) {
      return res.status(401).json({ error: "Access Denied. No token provided." });
    }

    // 3. Verify the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Attach the decoded user data to the request object
    req.user = decoded; 

    // 5. Move to the next middleware/controller
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = verifyToken;