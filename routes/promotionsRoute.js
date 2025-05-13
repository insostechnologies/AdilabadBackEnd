const express = require('express');
const router = express.Router();
const promotionsController = require("../controllers/promotionsController")


router.post('/notification/add', promotionsController.addPromotionNotification);
router.post('/vendor/notification/add', promotionsController.addPromotionNotificationVendor);
router.get('/vendor/notifications', promotionsController.getVendorNotifications);
router.get('/notifications', promotionsController.getNotifications);
router.delete('/notifications/delete', promotionsController.deleteNotifications);


module.exports = router;