const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController')

// no need for  JWT authentication
router.get('/',apiController.index)

module.exports = router;