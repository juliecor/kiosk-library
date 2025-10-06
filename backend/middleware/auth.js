const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    req.admin = decoded; // This will be available in the route handler
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};  

module.exports = authMiddleware;