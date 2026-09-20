/**
 * HTTP Cache-Control Middleware
 * Reduces API server CPU & DB load by setting browser and CDN caching headers for read-heavy GET requests.
 */

// Cache public responses for 5 minutes in browser, 15 minutes on CDN/Proxy
const publicCache = (maxAgeSeconds = 300, sMaxAgeSeconds = 900) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.set('Cache-Control', `public, max-age=${maxAgeSeconds}, s-maxage=${sMaxAgeSeconds}, stale-while-revalidate=60`);
        }
        next();
    };
};

// No-cache middleware for sensitive or real-time authenticated endpoints
const noCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

module.exports = {
    publicCache,
    noCache
};
