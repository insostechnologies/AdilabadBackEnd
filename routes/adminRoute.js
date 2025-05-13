const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body } = require('express-validator');

const logInValidate = [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required')
];


router.post('/log-in', logInValidate, userController.handleAdminLogin);

router.get('/', userController.index);


router.get('/dashboard-data', userController.getDashboardData);

module.exports = router;
