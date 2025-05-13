require("dotenv").config()

const config = {
    env: process.env.ENV,
    jwt_token:  process.env.JWT_KEY_SECRET,
    database: {
        host: process.env.ENV == 'prod' ? process.env.DB_HOST : process.env.DEV_DB_HOST, 
        user: process.env.ENV == 'prod' ? process.env.DB_USER : process.env.DEV_DB_USER,
        password: process.env.ENV == 'prod' ? process.env.DB_PASSWORD : process.env.DEV_DB_PASSWORD,
        database: process.env.ENV == 'prod' ? process.env.DB_NAME : process.env.DEV_DB_NAME,
    },
    url: {
        backend: process.env.ENV == 'prod' ? process.env.URL_BACKEND : process.env.DEV_URL_BACKEND,
        frontend:  process.env.ENV == 'prod' ? process.env.URL_FRONTEND : process.env.DEV_URL_FRONTEND,
    },
    SMS_API_KEY: process.env.fast2sms_API_KEY,
    SMS_SENDER_ID: process.env.fast2sms_SENDER_ID,
    SMS_MESSAGE_ID: process.env.fast2sms_MESSAGE_ID
} 
module.exports = config