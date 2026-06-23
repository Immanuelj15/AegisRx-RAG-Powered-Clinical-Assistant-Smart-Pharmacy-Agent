const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Resilient memory store fallback if MongoDB is down
const { getMockUserById } = require('../utils/mockDb');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ai_medassist_secure_jwt_token_2026_@_key');

      // Check if MongoDB is connected
      if (process.env.MONGO_CONNECTED === 'true') {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        // Fallback: get mock user or extract details from token payload
        req.user = getMockUserById(decoded.id) || {
          _id: decoded.id,
          name: decoded.name || 'Test User',
          email: decoded.email || 'test@example.com',
          role: decoded.role || 'Patient'
        };
      }

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized, no token provided' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
