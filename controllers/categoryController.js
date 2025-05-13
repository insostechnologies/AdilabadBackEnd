const categoryModel = require('../models/categoryModel');
const bannerModel = require('../models/bannerModel');
const { validationResult } = require('express-validator');
const { saveBase64File } = require('../utils/fileUplode')

let index = async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Server Running',
    });
};

let getAllCategories = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: {}
    };

    try {
        const banner_status = req.query.banner_status || 'all';

        const allData = await categoryModel.getAllCategories(banner_status);
        if (allData == null) {
            resp.message = 'NO CATEGORY FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true;
            resp.message = "Category list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error;
        return res.status(500).json(resp);
    }
}

let getAllParentCategories = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };

    try {
        const status = req.query.status || 'all';
        const banner_status = req.query.banner_status || 'all';

        // console.log(req.query)

        const allData = await categoryModel.getAllParentCategories(status,banner_status);
        if (allData == null) {
            resp.message = 'NO CATEGORY FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true;
            resp.message = "Category list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error;
        return res.status(500).json(resp);
    }
}

const getAllChildCategories = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: {}
    };

    try {
        const status = req.query.status || 'all';
        const allData = await categoryModel.getAllChildCategories(status);
        if (allData == null) {
            resp.message = 'NO CATEGORY FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true;
            resp.message = "Category list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error;
        return res.status(500).json(resp);
    }
}


let getCategoryById = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const category = await categoryModel.getCategoryById(uid);
        if (category === null) {
            resp.message = 'Category not found';
            return res.status(200).json(resp);
        }
        category.banners = await bannerModel.getCategoryBannerImages(uid,1)
        resp.status = true;
        resp.message = 'Category found';
        resp.data = category;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

const addCategory = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Category',
        errors: [],
        data: {}
    };



    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        let icon_type = 'icon';
        let icon_img_path = ''
        if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/category_images/';
            icon_img_path = await saveBase64File(base64Data, filePath);
            icon_type = 'img'
        }
        let cover_img_path = ''
        if (req.body.coverFile) {
            const base64Data = req.body.coverFile.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/category_cover_images/';
            cover_img_path = await saveBase64File(base64Data, filePath);
        }


        const categoryData = {
            parent_id: req.body.parent_id ? req.body.parent_id : '',
            name: req.body.name,
            icon_type: icon_type,
            list_type: req.body.list_type ? req.body.list_type : '',
            icon_img_path: icon_img_path,
            cover_img_path: cover_img_path,
            new_tag: req.body.new_tag,
            new_tag_text: req.body.new_tag_text,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            status: req.body.status,
            is_store_only: req.body.isStoreOnly
        };

        const categoryId = await categoryModel.addCategory(categoryData);
        if (categoryId) {
            resp.status = true;
            resp.message = "New Category Added";
            resp.data = { 'category_id': categoryId };
            return res.status(200).json(resp);
        } else {
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
};


const updateCategoryRank = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Category',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;
        const rank = req.body.rank

        // console.log(rank)

        let updated = await categoryModel.updateCategoryRank(uid, rank);


        if (updated) {
            resp.status = true;
            resp.message = "Category Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Category not found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}

let updateSubCategoryRank = async (req , res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Category',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;
        const rank = req.body.rank
        const parent_id = req.body.parent_id

        // console.log(uid,rank,parent_id)

        let updated = await categoryModel.updateSubCategoryRank(uid, rank,parent_id);


        if (updated) {
            resp.status = true;
            resp.message = "Category Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Category not found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }


}

let updateCategory = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Category',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        let icon_img_path = ''
        let is_icon_img_changed = false
        if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/category_images/';
            icon_img_path = await saveBase64File(base64Data, filePath);
            is_icon_img_changed = true
        }
        

        let banner_img_path = ''
        let is_banner_img_changed = false
        if (req.body.coverFile) {
            const base64Data = req.body.coverFile.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/category_banner_images/';
            banner_img_path = await saveBase64File(base64Data, filePath);
            is_banner_img_changed = true
        }
        // console.log(req.body.coverFile)
        // console.log(is_banner_img_changed)


        const categoryData = {
            parent_id: req.body.parent_id ? req.body.parent_id : '',
            name: req.body.name,
            new_tag_text: req.body.new_tag_text,
            meta_title: req.body.meta_title,
            meta_description: req.body.meta_description,
            icon_img_path: icon_img_path,
            list_type: req.body.list_type,
            is_icon_img_changed: is_icon_img_changed,
            is_banner_img_changed: is_banner_img_changed,
            banner_img_path: banner_img_path,
            new_tag: req.body.new_tag ? 1 : 0,
            status: req.body.status ? 1 : 0
        };

        const updated = await categoryModel.updateCategory(uid, categoryData);
        if (updated) {
            resp.status = true;
            resp.message = "Category Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Category not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let updateCategoryStatus = async (req, res) => {

    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Category Status',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const updated = await categoryModel.updateCategoryStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Category Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Category Status not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let deleteCategory = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Delete Category',
        errors: [],
        data: {}
    };

    const uid = req.params.uid;

    try {
        const deleted = await categoryModel.deleteCategory(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Category Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Category not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

// Sub-category
let getSubCategoriesByParentId = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };

    const parent_id = req.params.parent_id;

    try {
        const status = req.query.status || 'all';
        const subCategories = await categoryModel.getSubCategoriesByParentId(parent_id,status);
        if (subCategories === null) {
            resp.message = 'No sub-categories found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Sub-categories found';
        resp.data = subCategories;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};


module.exports = {
    index,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getAllCategories,
    getSubCategoriesByParentId,
    getAllParentCategories,
    getAllChildCategories,
    updateCategoryStatus,
    updateCategoryRank,
    updateSubCategoryRank
}
