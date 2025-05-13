const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { body, param } = require('express-validator');



const IdValidate = [
    param('uid').notEmpty().withMessage('Id is required')
];

router.post('/add/:uid',  IdValidate, productController.addProduct);
router.post('/image/add/:uid', IdValidate, productController.addProductImages)


router.put('/update/:uid', IdValidate, productController.updateProduct);
router.put('/update/status/:uid', IdValidate, productController.updateProductStatus);
router.put('/update/rank/:uid', IdValidate, productController.updateProductRank)
router.put('/image/update/status/:uid', IdValidate, productController.updateProductImageStatus)
router.put('/image/update/rank/:uid' , IdValidate, productController.updateProductImageRank)
router.put('/image/update/:uid' , IdValidate, productController.updateProductImage)


router.delete('/delete/:uid', IdValidate, productController.deleteProduct);
router.delete('/image/delete/:uid', IdValidate, productController.deleteProductImage)

router.get('/', productController.getProductList);
router.get('/:uid', IdValidate, productController.getProductById);
router.get('/images/:uid', IdValidate, productController.getProductImages)
router.get('/image/:uid', IdValidate, productController.getProductImageById)
router.get('/list/:uid', IdValidate, productController.getAllProducts);

module.exports = router;
