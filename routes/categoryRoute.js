const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { body, param } = require('express-validator');

const categoryValidate = [
    // body('uid').notEmpty().withMessage('UID is required'),
    // body('parent_id').optional().isString().withMessage('Parent ID should be a string'),
    body('name').notEmpty().withMessage('Category name is required'),
    // body('icon_type').notEmpty().withMessage('Icon type is required'),
    // body('icon').notEmpty().withMessage('Icon is required'),
    // body('icon_img_path').optional().isString().withMessage('Icon image path should be a string'),
    // body('new_tag').optional().isBoolean().withMessage('New tag should be a boolean'),
    // body('status').notEmpty().withMessage('Status is required').isIn(['active', 'inactive']).withMessage('Invalid status value')
];

// const updateCategoryValidate = [
//     param('uid').notEmpty().withMessage('Category ID is required'),
//     body('name').optional().notEmpty().withMessage('Category name is required'),
//     body('icon_type').optional().notEmpty().withMessage('Icon type is required'),,
//     body('icon_img_path').optional().isString().withMessage('Icon image path should be a string'),
//     body('new_tag').optional().isBoolean().withMessage('New tag should be a boolean'),
//     body('status').optional().notEmpty().withMessage('Status is required')
// ];

const categoryIdValidate = [
    param('uid').notEmpty().withMessage('Category ID is required')
];


const parentIdValidate = [
    param('parent_id').notEmpty().withMessage('Parent ID is required')
];

// GET
router.get('/', categoryController.getAllCategories);
router.get('/parents', categoryController.getAllParentCategories);
router.get('/childrens', categoryController.getAllChildCategories);
router.get('/:uid', categoryIdValidate, categoryController.getCategoryById);
router.get('/sub-category/:parent_id', parentIdValidate, categoryController.getSubCategoriesByParentId);
// POST
router.post('/add', categoryValidate, categoryController.addCategory);
// PUT
router.put('/update/:uid', categoryController.updateCategory);
router.put('/update/status/:uid', categoryIdValidate, categoryController.updateCategoryStatus);
router.put('/update/rank/:uid',categoryIdValidate, categoryController.updateCategoryRank);
router.put('/sub-category/update/rank/:uid',categoryIdValidate, categoryController.updateSubCategoryRank);
// DELETE
router.delete('/delete/:uid', categoryIdValidate, categoryController.deleteCategory);



module.exports = router;
