require("dotenv").config();

// Startup validation for mandatory environment variables in production
if (process.env.ENV === 'prod') {
    const requiredKeys = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_KEY_SECRET'];
    const missing = requiredKeys.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.warn(`[Config Warning] Missing production environment variables: ${missing.join(', ')}. Falling back to defaults where available.`);
    }
}

const config = {
    env: process.env.ENV || 'dev',
    jwt_token: process.env.JWT_KEY_SECRET || '7208c08d8aba1f11a6b6e49a36a25d89',
    database: {
        host: process.env.ENV == 'prod' ? process.env.DB_HOST : (process.env.DEV_DB_HOST || 'localhost'),
        user: process.env.ENV == 'prod' ? process.env.DB_USER : (process.env.DEV_DB_USER || 'root'),
        password: process.env.ENV == 'prod' ? process.env.DB_PASSWORD : (process.env.DEV_DB_PASSWORD || ''),
        database: process.env.ENV == 'prod' ? process.env.DB_NAME : (process.env.DEV_DB_NAME || 'adilabadDb'),
    },
    url: {
        backend: process.env.ENV == 'prod' ? process.env.URL_BACKEND : (process.env.DEV_URL_BACKEND || 'http://localhost:5000'),
        frontend: process.env.ENV == 'prod' ? process.env.URL_FRONTEND : (process.env.DEV_URL_FRONTEND || 'http://localhost:3000'),
    },
    SMS_API_KEY: process.env.fast2sms_API_KEY,
    SMS_SENDER_ID: process.env.fast2sms_SENDER_ID,
    SMS_MESSAGE_ID: process.env.fast2sms_MESSAGE_ID
};

module.exports = config;