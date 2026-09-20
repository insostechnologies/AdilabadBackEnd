const express = require('express');
const app = express();
const path = require('path');
const port = process.env.PORT || 5000;
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config/config');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware - Dynamic CORS origin handling
const allowedOrigins = [
    config.url.frontend,
    'https://www.adilabadapp.com',
    'https://adilabadapp.com',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow during transition phase
        }
    },
    credentials: true
}));

app.use(bodyParser.urlencoded({ limit: '15mb', extended: true }));
app.use(bodyParser.json({ limit: '15mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// emojies validation
app.use((req, res, next) => {
    const emojiRegex = /[\u{1F600}-\u{1FBFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string' && emojiRegex.test(req.body[key])) {
                return res.status(200).json({
                    status: false,
                    message: "Emojis are not allowed in the input."
                });
            }
        }
    }
    next();
});

// Routes
app.use('/api', require('./routes/apiRoute'));
app.use('/api/admin', require('./routes/adminRoute'));
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/category', require('./routes/categoryRoute'));
app.use('/api/banner', require('./routes/bannerRoute'));
app.use('/api/promotions', require('./routes/promotionsRoute'));
app.use('/api/store', require('./routes/storeRoute'));
app.use('/api/product', require('./routes/productRoute'));
app.use('/api/keywords', require('./routes/keywordRoute'));

// Root endpoint / Health Check
app.get('/', (req, res) => {
    res.status(200).json({
        status: true,
        message: `Adilabad API server running [${config.env || 'DEV'}]`,
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Server start
app.listen(port, () => {
    console.log(`Server is running on port ${port} [ENV: ${config.env || 'DEV'}]`);
});
