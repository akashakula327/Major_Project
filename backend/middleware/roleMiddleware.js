// middleware/roleMiddleware.js

// Middleware to check user role
exports.checkRole = (roleName) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized: no user info' });
        }
        if (req.user.role !== roleName) {
            return res.status(403).json({ message: 'Access forbidden: insufficient privileges' });
        }
        next();
    };
};
