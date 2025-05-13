const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { param } = require('express-validator');




const bannerIdValidate = [
    param('uid').notEmpty().withMessage('ID is required')
];

// GET
router.get('/', bannerController.getAllBanners);
router.get('/images/list/:uid', bannerIdValidate, bannerController.getBannersImages);
router.get('/images/:uid', bannerIdValidate, bannerController.getBannerImageById);
router.get('/:uid', bannerIdValidate, bannerController.getBannerById);
router.get('/category/images/list/:uid', bannerIdValidate, bannerController.getCategoryBannerImages);
router.get('/category/image/:uid', bannerIdValidate, bannerController.getCategoryBannerImagesById);
// POST
router.post('/images/add/:uid', bannerIdValidate, bannerController.addBannerImages);
router.post('/add', bannerController.addBanner);
router.post('/category/add/:uid',bannerIdValidate, bannerController.addCategoryBanner);
// PUT
router.put('/images/update/status/:uid', bannerIdValidate, bannerController.updateBannerImageStatus);
router.put('/images/update/rank/:uid', bannerIdValidate, bannerController.updateBannerImageRank);
router.put('/images/update/:uid', bannerIdValidate, bannerController.updateBannerImage);
router.put('/update/status/:uid', bannerIdValidate, bannerController.updateBannerStatus);
router.put('/update/rank/:uid', bannerIdValidate, bannerController.updateBannerRank);
router.put('/update/:uid', bannerIdValidate, bannerController.updateBanner);
router.put('/category/image/update/:uid',bannerIdValidate, bannerController.updateCategoryBannerImage)
router.put('/category/update/status/:uid',bannerIdValidate, bannerController.updateCategoryBannerStatus)
router.put('/category/images/update/status/:uid',bannerIdValidate, bannerController.updateCategoryBannerImagesStatus)
// DELETE
router.delete('/delete/:uid', bannerIdValidate, bannerController.deleteBanner);
router.delete('/images/delete/:uid', bannerIdValidate, bannerController.deleteBannerImage);
router.delete('/category/images/delete/:uid', bannerIdValidate, bannerController.deleteCategoryBannerImage);

module.exports = router;
