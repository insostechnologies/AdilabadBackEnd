const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const keywordController = require('../controllers/keywordController');

// Validation rules for adding/updating keywords
const keywordValidationRules = [
    body('keyword').isString().withMessage('Title must be a string').notEmpty().withMessage('Title cannot be empty'),
];

// Route to get all keywords
router.get('/', keywordController.getAllKeywords);

// Route to get a keyword by ID
router.get('/:uid', keywordController.getKeywordById);

// Route to add a new keyword
router.post('/:uid', keywordValidationRules, keywordController.addKeyword);

// Route to update an existing keyword
router.put('/:uid', keywordValidationRules, keywordController.updateKeyword);

// Route to delete a keyword
router.delete('/:uid', keywordController.deleteKeyword);

module.exports = router;
