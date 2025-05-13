const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { body, param } = require('express-validator');



const storeIdValidate = [
    param('uid').notEmpty().withMessage('Store ID is required')
];


router.get('/', storeController.getAllStores);

router.get('/permissions', storeController.getStorePermissions);
router.get('/leads/calls-chats',  storeController.getStoreLeadsCallsChats);
router.get('/leads', storeController.getStoreLeads);

router.get('/search', storeController.searchStores);
router.get('/search/keywords', storeController.searchStoresByKeyWords);

router.get('/keywords/:uid', storeController.getKeywords);
router.get('/analitycs/:uid', storeController.getStoreAnalitycs);
router.get('/followers/:uid', storeController.getStoreFollowers);
router.get('/comments/:uid', storeController.getStoreComments); // Specific before general
router.get('/comments', storeController.getAllStoreComments);   // General

router.get('/comment/reply/:uid', storeIdValidate, storeController.getCommentById);
router.get('/images/:uid', storeIdValidate, storeController.getStoreImages);
router.get('/image/:uid', storeIdValidate, storeController.getStoreImageById);

router.get('/:uid', storeIdValidate, storeController.getStoreById); // Keep this last to prevent conflicts


router.post('/add', storeController.addStore);
router.post('/keywords/add', storeController.addKeywords);
router.post('/comment/add/:uid', storeController.addStoreComment);
router.post('/metadata/:uid', storeIdValidate, storeController.addStoreMetaData);
router.post('/offer/:uid', storeIdValidate, storeController.addStoreOffer);
router.post('/cover/add/:uid', storeIdValidate, storeController.addStoreCover);
router.post('/banner/add/:uid', storeIdValidate, storeController.addStoreBanner);
router.post('/gallery/add/:uid', storeIdValidate, storeController.addStoreGallery);
router.post('/video/add/:uid', storeIdValidate, storeController.addStoreVideo);
router.post('/logo/add/:uid', storeIdValidate, storeController.addStoreLogo);
router.post('/leads/add',  storeController.addStoreLeads);
router.post('/update/time/status/:uid', storeController.updateStoreTimeStatus)

router.put('/update/status/:uid', storeIdValidate, storeController.updateStoreStatus)
router.put('/comment/update/status/:uid', storeIdValidate, storeController.updateStoreCommentStatus)
router.put('/update/:uid', storeIdValidate, storeController.updateStore);
router.put('/update/rank/:uid', storeIdValidate, storeController.updateStoreRank)
router.put('/image/update/status/:uid', storeIdValidate, storeController.updateStoreImageSatus)
router.put('/image/update/:uid', storeIdValidate, storeController.updateStoreImage)
router.put('/details/update/:uid', storeIdValidate, storeController.updateStoreDetails)
router.put('/offer/update/:uid', storeIdValidate, storeController.updateStoreOffers)
router.put('/metadata/update/:uid', storeIdValidate, storeController.updateStoreMetadata)
router.put('/image/update/rank/:uid',storeIdValidate, storeController.updateStoreImageRank)
router.put('/delivery/update/:uid',storeIdValidate, storeController.updateStoreDeliveryCharges)
router.put('/gst/update/:uid',storeIdValidate, storeController.updateStoreGstCharges)
router.put('/save/:uid', storeIdValidate, storeController.saveStore)
router.put('/follow/:uid', storeIdValidate, storeController.followStore)
router.put('/comment/reply/update/:uid',storeIdValidate, storeController.updateStoreCommentReply);
router.put('/permissions', storeController.updateStorePermissions);

router.delete('/keywords/delete/:uid', storeController.deleteKeywords);
router.delete('/keywords/delete', storeController.deleteStoreKeywords);
router.delete('/delete/:uid', storeIdValidate, storeController.deleteStore);
router.delete('/comment/delete/:uid', storeIdValidate, storeController.deleteStoreComment);
router.delete('/image/delete/:uid', storeIdValidate, storeController.deleteStoreImage);

module.exports = router;
