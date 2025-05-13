const { validationResult } = require('express-validator');
const KeywordModel = require('../models/keywordModel');

const getAllKeywords = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };

    try {
        const allData = await KeywordModel.getAllKeywords();
        if (allData == null) {
            resp.message = 'NO KEYWORDS FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true;
            resp.message = "Keyword list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error.message || 'Internal server error';
        return res.status(500).json(resp);
    }
};

const getKeywordById = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const keyword = await KeywordModel.getKeywordById(uid);
        if (keyword === null) {
            resp.message = 'Keyword not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Keyword found';
        resp.data = keyword;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};

const addKeyword = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Keyword',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const uid = req.params.uid;
        const keyword_id = await KeywordModel.addKeyword(req.body,uid);

        resp.status = true;
        resp.message = 'Keyword Added Successfully';
        resp.data = { keyword_id };
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }
};

const updateKeyword = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Keyword',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const keywordData = {
            title: req.body.title
        };

        const updated = await KeywordModel.updateKeyword(uid, keywordData);
        if (updated) {
            resp.status = true;
            resp.message = "Keyword Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Keyword not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};

const deleteKeyword = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Delete Keyword',
        errors: [],
        data: {}
    };

    const uid = req.params.uid;

    try {
        const deleted = await KeywordModel.deleteKeyword(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Keyword Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Keyword not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};

module.exports = {
    addKeyword,
    getKeywordById,
    getAllKeywords,
    updateKeyword,
    deleteKeyword
};
