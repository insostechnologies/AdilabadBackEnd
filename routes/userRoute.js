const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { body, param } = require('express-validator');
const jwtMiddleware = require('../middleware/authMiddleware'); // JWT middleware import 

const signUpValidate = [
    body('phoneNumber').notEmpty().withMessage('phone number is required'),
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const signInValidate = [
    body('phoneNumber').notEmpty().withMessage('phone number is required'),
];

const userIdValidate = [
    param('uid').notEmpty().withMessage('user ID is required')
];

const otpValidate = [
    body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 4, max: 4 }).withMessage('OTP must be 4 digits'),
    body('user_id').notEmpty().withMessage('User ID is required')
]

const logInValidate = [
    // body('phoneNumber').notEmpty().withMessage('phone number is required'),
    body('password').notEmpty().withMessage('Password is required')
];



// No need for  JWT authentication  
router.post('/sign-up', signUpValidate, userController.handleUserSignUp);
router.post('/sign-in', signInValidate, userController.handleUserSignIn);
router.post('/log-in', userController.handleUserLogin);
router.post('/otp/verify', otpValidate, userController.verifyOtp);
router.post('/otp/resend', userController.resendOtp)
router.post('/leads/add', userController.addLeads);
router.post('/enquiry/add', userController.addEnquiry);
router.post('/order/add', userController.addNewOrder);
router.post('/address/add', userController.addUserAddess);
router.post('/vendor/add', userController.addVendor);
router.post('/member/add', userController.addMember);
router.post('/site/about/update', userController.updateSiteAbout);

// PUT REQ
router.put('/policy', userController.updateUserPolicy)
router.put('/update/:uid', userIdValidate, userController.updateUser);
router.put('/vendor/status/:uid', userController.updateVendorStatus);
router.put('/update/details/:uid', userIdValidate, userController.updateUserDetails);
router.put('/social/update/:uid', userIdValidate, userController.updateUserSocial);
router.put('/seo/update/:uid', userIdValidate, userController.updateUserSeo);
router.put('/details/add/:uid', userIdValidate, userController.addUserName)
router.put('/order/place/:uid', userIdValidate, userController.placeOrder)
router.put('/order/update/status/:uid', userIdValidate, userController.updateOrderStatus)
router.put('/vendor/social/count/status', userController.updateVendorScoialStatus)
router.put('/vendor/access/:uid', userController.updateVendorAccess)

// JWT authentication required here
router.get('/', userController.getAllUser);
router.get('/policy', userController.getUserPolicy)
router.get('/members', userController.getMember);
router.get('/queries', userController.getQueries);
router.get('/notifications/:uid', userIdValidate, userController.getNotification);
router.get('/:uid', userIdValidate, userController.getUserById);
router.get('/order/list', userIdValidate, userController.getAllOrder);
router.get('/site/details', userController.getSiteDetails);
router.get('/stores/:uid', userController.getUserStores);
router.get('/stores/list/:uid', userController.getUserStoresList);
router.get('/stores/followes/:uid', userController.getUserStoresFollowes);
router.get('/leads/search', userController.getSearchLeads);
router.get('/leads/store', userController.getuserStoreLeads)
router.get('/leads/:uid', userIdValidate, userController.getLeads);
router.get('/clicks/:uid', userIdValidate, userController.getUserClicks);
router.get('/order/:uid', userIdValidate, userController.getOrderDetails);
router.get('/orders/:uid', userIdValidate, userController.getUserOrders);
router.get('/vendor/store/:uid', userIdValidate, userController.getVendorStore);
router.get('/vendor/social/count/status', userController.getVendorScoialStatus)
router.get('/site/about', userController.getSiteAbout);


router.delete('/notifications/delete/:uid', userController.deleteNotification);
router.delete('/vendor/notifications/delete/:uid', userController.deleteVendorNotification);
router.delete('/members/delete/:uid', userController.deleteMembers);
router.delete('/delete/:uid', userController.deleteUser);


module.exports = router;