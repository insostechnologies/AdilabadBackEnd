let rateLimit;

try {
    rateLimit = require('express-rate-limit');
} catch (e) {
    rateLimit = null;
}

/**
 * Creates a rate limiting middleware for sensitive routes (Login, OTP, Admin)
 * @param {object} options - Rate limit settings (windowMs, max, message)
 */
function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const max = options.max || 10; // 10 attempts
    const message = options.message || 'Too many attempts from this IP, please try again after 15 minutes.';

    if (rateLimit) {
        return rateLimit({
            windowMs,
            max,
            standardHeaders: true,
            legacyHeaders: false,
            message: { status: false, message }
        });
    }

    // Lightweight in-memory fallback if express-rate-limit is not installed
    const hits = new Map();

    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown-ip';
        const now = Date.now();
        const clientHits = hits.get(ip) || [];

        // Filter out hits outside current window
        const validHits = clientHits.filter(time => now - time < windowMs);

        if (validHits.length >= max) {
            return res.status(429).json({
                status: false,
                message: message
            });
        }

        validHits.push(now);
        hits.set(ip, validHits);
        next();
    };
}

// Pre-configured rate limiters
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

const otpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: 'Too many OTP requests. Please wait 10 minutes before requesting again.'
});

const apiLimiter = createRateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'API request threshold exceeded. Please slow down.'
});

module.exports = {
    createRateLimiter,
    authLimiter,
    otpLimiter,
    apiLimiter
};
