const { validationResult } = require('express-validator');
const ProductModel = require('../models/productModel');
const StoreModel = require('../models/storeModel');
const { saveBase64File } = require('../utils/fileUplode')

const getAllProducts = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: {}
    };

    try {
        const status = req.query.status || 'all';
        const store_id = req.params.uid;

        const allData = await ProductModel.getAllProducts(status, store_id);
        const storeData = await StoreModel.getStoreById(store_id, 1)
        if (allData == null) {
            resp.message = 'NO PRODUCT FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true;
            resp.message = "Product list found";
            resp.data = allData;
            resp.storeData = storeData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error.message || 'Internal server error';
        return res.status(500).json(resp);
    }
};
const getProductList = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: {}
    };

    try {
        const status = req.query.status || 'all';

        const allData = await ProductModel.getProductList(status);
        if (allData == null) {
            resp.message = 'NO PRODUCT FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true;
            resp.message = "Product list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error.message || 'Internal server error';
        return res.status(500).json(resp);
    }
};

const getProductById = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const product = await ProductModel.getProductById(uid);
        if (product === null) {
            resp.message = 'Product not found';
            return res.status(200).json(resp);
        } else {
            product.keywords = await ProductModel.getProductKeyword(uid);
        }
        resp.status = true;
        resp.message = 'Product found';
        resp.data = product;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};

const addProduct = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Product',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const product_data = {
            productName: req.body.productName,
            price: req.body.price,
            discount: req.body.discount,
            sellingPrice: req.body.sellingPrice,
            isActive: req.body.isActive,
            stockStatus: req.body.stockStatus,
            cartAction: req.body.cartAction,
            gst: req.body.gst,
            storeShortDesc: req.body.storeShortDesc,
            type: req.body.type
        }
        const storeId = req.params.uid;
        const keyWords = req.body.keyWords
        const product_id = await ProductModel.addProduct(product_data, storeId);
        if (keyWords.length > 0) {
            await Promise.all(keyWords.map(async (item, index) => {
                await ProductModel.addProductKeyword(product_id, item.uid);
                // console.log(item);
            }));
        }

        resp.status = product_id ? true : false;
        resp.message = product_id ? 'Product Added Successfully' : 'cannot add product';
        resp.data = { product_id };
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }
};

const updateProduct = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Product',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const productData = {
            productName: req.body.productName,
            price: req.body.price,
            discount: req.body.discount,
            sellingPrice: req.body.sellingPrice,
            isActive: req.body.isActive,
            stockStatus: req.body.stockStatus,
            cartAction: req.body.cartAction,
            gst: req.body.gst,
            storeShortDesc: req.body.storeShortDesc,
            type: req.body.type
        };

        const updated = await ProductModel.updateProduct(uid, productData);
        const deleteKeywords = await ProductModel.deleteProductKeywords(uid)

        const keyWords = req.body.keyWords
        if (keyWords.length > 0) {
            await Promise.all(keyWords.map(async (item, index) => {
                await ProductModel.addProductKeyword(uid, item.uid);
                // console.log(item);
            }));
        }
        if (updated) {
            resp.status = true;
            resp.message = "Product Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Product not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};

const updateProductStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Product',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }


    try {
        const uid = req.params.uid;
        const updated = await ProductModel.updateProductStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Product Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Product not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const deleteProduct = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Delete Product',
        errors: [],
        data: {}
    };

    const uid = req.params.uid;

    try {
        const deleted = await ProductModel.deleteProduct(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Product Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Product not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};


const updateProductRank = async (req, res) => {
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
        const store_id = req.body.store_id
        // console.log(rank)
        let updated = await ProductModel.updateProductRank(uid, rank, store_id);
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



const addProductImages = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Product Image',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }


    try {
        const uid = req.params.uid;
        const isUpdated = await ProductModel.increaseProductImageRanks(uid, req.body.images.length)
        let isUploded = false
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/product_images/';
            path = img.base64 != '' ? await saveBase64File(base64Data, filePath) : 'uploads/placeholder/placeholder.jpg';
            isUploded = await ProductModel.addProductImages(path, uid, index + 1, img.title, img.linkText);
        }));
        resp.status = isUploded;
        resp.message = isUploded ? 'Banners Added Successfully' : 'Cannot Add Banners';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let getProductImageById = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: []
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    const status = req.query.status || 'all';
    try {
        const banners = await ProductModel.getProductImageById(uid, status);
        // const banner = await bannerModel.getBannerById(uid);
        if (banners) {
            resp.status = true;
            resp.message = "Banner Images Found";
            // resp.bannerData = banner
            resp.data = banners
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Images Not Found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}


let getProductImages = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: []
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    const status = req.query.status || 'all';
    try {
        const banners = await ProductModel.getProductImages(uid, status);
        // const banner = await bannerModel.getBannerById(uid);
        if (banners) {
            resp.status = true;
            resp.message = "Banner Images Found";
            // resp.bannerData = banner
            resp.data = banners
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Images Not Found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}

const updateProductImageStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Product',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }


    try {
        const uid = req.params.uid;
        const updated = await ProductModel.updateProductImageStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Product Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Product not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let updateProductImageRank = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Product Image',
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
        const product_id = req.body.product_id
        // console.log(rank)
        let updated = await ProductModel.updateProductImageRank(uid, rank, product_id);
        if (updated) {
            resp.status = true;
            resp.message = "Product Image Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Product Image  not found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}


let deleteProductImage = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot delete Image',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    const uid = req.params.uid;

    try {
        const deleted = await ProductModel.deleteProductImage(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Image Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Image not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}


let updateProductImage = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;

        let data = {
            title: req.body.title,
            link: req.body.link,
        }
        if (req.body.image.path) {
            data.path = req.body.image.path
        } else {
            const base64Data = req.body.image.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = `uploads/product_images/`;
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = await ProductModel.updateProductImage(uid, data);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'Banners Updated Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update Banners';
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

module.exports = {
    addProduct,
    updateProductRank,
    getProductById,
    getAllProducts,
    updateProduct,
    updateProductStatus,
    deleteProduct,
    addProductImages,
    getProductImages,
    updateProductImageStatus,
    updateProductImageRank,
    deleteProductImage,
    getProductImageById,
    updateProductImage,
    getProductList
};
