const jwt = require('jsonwebtoken');
const config = require('../config/config')
const JWT_SECRET = config.jwt_token; // JWT secret key

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['x-auth-token'];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to authenticate token' });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
}

module.exports = verifyToken;
