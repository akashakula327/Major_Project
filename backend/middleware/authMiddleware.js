const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied. No token.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

exports.authorize = roles => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permission denied.' });
    }
    next();
  };
};
