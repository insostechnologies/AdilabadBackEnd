const storeModel = require('../models/storeModel');
const categoryModel = require('../models/categoryModel');
const ProductModel = require('../models/productModel')
const { validationResult } = require('express-validator');
const { saveBase64File } = require('../utils/fileUplode')
const userModel = require('../models/userModel')

let getAllStores = async (req, res) => {
    let resp = {
        status: false,
        message: 'NO STORE FOUND',
        data: []
    };

    try {
        // console.time();
        const status = req.query.status || 'all';
        const cid = req.query.cid || false;
        let stores = [];

        if (cid) {
            const [allData, categoryData] = await Promise.all([
                storeModel.getAllStoresIdbyCategoryId(cid),
                categoryModel.getCategoryById(cid, status)
            ]);

            resp.categoryData = categoryData;

            if (allData && allData.length > 0) {
                stores = await Promise.all(
                    allData.map(async (item) => {
                        const [
                            storeDetails,
                            categories,
                            details,
                            offer,
                            address,
                            comments,
                            images,
                            time,
                            products
                        ] = await Promise.all([
                            storeModel.getStoreById(item.store_id, status),
                            storeModel.getStoreCategoriesById(item.store_id),
                            storeModel.getStoreDetailsById(item.store_id),
                            storeModel.getStoreOfferById(item.store_id),
                            storeModel.getStoreAddressById(item.store_id),
                            storeModel.getStoreComments(item.store_id, 1),
                            (async () => {
                                return {
                                    logo: await storeModel.getStoreImages(item.store_id, 1, 'logo'),
                                    gallery: await storeModel.getStoreImages(item.store_id, 1, 'gallery'),
                                    banner: await storeModel.getStoreImages(item.store_id, 1, 'banner'),
                                    cover: await storeModel.getStoreImages(item.store_id, 1, 'cover')
                                };
                            })(),
                            storeModel.getStoreTimeById(item.store_id),
                            ProductModel.getAllProducts(1, item.store_id)
                        ]);

                        return {
                            ...storeDetails,
                            categories,
                            details,
                            offer,
                            address,
                            comments,
                            images,
                            time,
                            products
                        };
                    })
                );
            }
        } else {
            const allData = await storeModel.getAllStores(status);

            if (allData && allData.length > 0) {
                stores = await Promise.all(
                    allData.map(async (item) => {
                        const [
                            categories,
                            details,
                            offer,
                            address,
                            comments,
                            images,
                            time,
                            products
                        ] = await Promise.all([
                            storeModel.getStoreCategoriesById(item.uid),
                            storeModel.getStoreDetailsById(item.uid),
                            storeModel.getStoreOfferById(item.uid),
                            storeModel.getStoreAddressById(item.uid),
                            storeModel.getStoreComments(item.store_id, 1),
                            (async () => {
                                return {
                                    logo: await storeModel.getStoreImages(item.uid, 1, 'logo'),
                                    gallery: await storeModel.getStoreImages(item.uid, 1, 'gallery'),
                                    banner: await storeModel.getStoreImages(item.uid, 1, 'banner'),
                                    cover: await storeModel.getStoreImages(item.uid, 1, 'cover')
                                };
                            })(),
                            storeModel.getStoreTimeById(item.uid),
                            ProductModel.getAllProducts(1, item.uid)
                        ]);

                        return {
                            ...item,
                            categories,
                            details,
                            offer,
                            address,
                            comments,
                            images,
                            time,
                            products
                        };
                    })
                );
            }
        }
        if (stores.length === 0) {
            return res.status(200).json(resp);
        } else {
            stores = Array.from(new Map(stores.map(item => [item.uid, item])).values());
            // console.timeEnd();
            resp.status = true;
            resp.message = "Store list found";
            resp.data = stores;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error;
        return res.status(500).json(resp);
    }
};

let searchStores = async (req, res) => {
    let resp = {
        status: false,
        message: 'NO STORE FOUND',
        data: []
    };

    try {
        // console.time();
        const status = req.query.status || 'all';
        const searchTerm = req.query.q || false;
        let stores = [];


        const allData = await storeModel.searchStores(status, searchTerm);

        if (allData && allData.length > 0) {
            stores = await Promise.all(
                allData.map(async (item) => {
                    const [
                        categories,
                        details,
                        offer,
                        address,
                        comments,
                        images
                    ] = await Promise.all([
                        storeModel.getStoreCategoriesById(item.uid),
                        storeModel.getStoreDetailsById(item.uid),
                        storeModel.getStoreOfferById(item.uid),
                        storeModel.getStoreAddressById(item.uid),
                        storeModel.getStoreComments(item.store_id, 1),
                        (async () => {
                            return {
                                logo: await storeModel.getStoreImages(item.uid, 1, 'logo'),
                                gallery: await storeModel.getStoreImages(item.uid, 1, 'gallery'),
                                banner: await storeModel.getStoreImages(item.uid, 1, 'banner'),
                                cover: await storeModel.getStoreImages(item.uid, 1, 'cover')
                            };
                        })()
                    ]);

                    return {
                        ...item,
                        categories,
                        details,
                        offer,
                        address,
                        comments,
                        images
                    };
                })
            );
        }

        if (stores.length === 0) {
            return res.status(200).json(resp);
        } else {
            // console.timeEnd();
            resp.status = true;
            resp.message = "Store list found";
            resp.data = stores;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error;
        return res.status(500).json(resp);
    }
};
let searchStoresByKeyWords = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };

    try {
        // Get search query
        const q = req.query.q || '';

        // Fetch keywords based on the query
        const keywords = await storeModel.getStoreIdBySearch(q);

        console.log(keywords);

        // If no keywords are found, return a response
        if (!keywords || keywords.length === 0) {
            resp.message = 'No stores found for the given keyword.';
            return res.status(200).json(resp);
        }

        // Create a Set to track unique store IDs
        const uniqueStoreIds = new Set();

        // Fetch stores with images in parallel
        const storePromises = keywords.map(async (keyword) => {
            try {
                // Skip duplicate store IDs
                if (uniqueStoreIds.has(keyword.store_id)) return null;

                uniqueStoreIds.add(keyword.store_id);

                // Fetch store details
                const store = await storeModel.getStoreById(keyword.store_id, 1);
                if (!store) return null;

                // Fetch store images and other details
                const [
                    categories,
                    details,
                    offers,
                    address,
                    comments,
                    images
                ] = await Promise.all([
                    storeModel.getStoreCategoriesById(store.uid),
                    storeModel.getStoreDetailsById(store.uid),
                    storeModel.getStoreOfferById(store.uid),
                    storeModel.getStoreAddressById(store.uid),
                    storeModel.getStoreComments(store.uid, 1),
                    (async () => ({
                        logo: await storeModel.getStoreImages(store.uid, 1, 'logo'),
                        gallery: await storeModel.getStoreImages(store.uid, 1, 'gallery'),
                        banner: await storeModel.getStoreImages(store.uid, 1, 'banner'),
                        cover: await storeModel.getStoreImages(store.uid, 1, 'cover')
                    }))()
                ]);

                // Combine all data into a single store object
                return {
                    ...store,
                    categories: categories || [],
                    details: details || null,
                    offers: offers || [],
                    address: address || null,
                    comments: comments || [],
                    images: {
                        logo: images.logo || null,
                        gallery: images.gallery || [],
                        banner: images.banner || null,
                        cover: images.cover || null
                    }
                };
            } catch (error) {
                console.error(`Error fetching store or images for ID ${keyword.store_id}:`, error);
                return null; // Skip invalid stores
            }
        });

        const stores = await Promise.all(storePromises);

        // Prepare the response
        const validStores = stores.filter(store => store !== null);
        resp.status = true;
        resp.message = validStores.length ? 'Stores found successfully.' : 'No valid stores found.';
        resp.data = validStores;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);

        // Handle unexpected errors
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};





let saveStore = async (req, res) => {
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
        const store_id = req.params.uid;
        const user_id = req.body.userId

        let isUpdated = await storeModel.saveStore(store_id, user_id);

        if (isUpdated) {
            resp.status = true;
            resp.type = isUpdated
            resp.message = 'Store Saved Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Save Store';
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let followStore = async (req, res) => {
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
        const store_id = req.params.uid;
        const user_id = req.body.userId

        let isUpdated = await storeModel.followStore(store_id, user_id);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'Store Followed Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Save Store';
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let getStoreImages = async (req, res) => {
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
        const status = req.query.status || 'all';
        const type = req.query.type || '';

        const covers = await storeModel.getStoreImages(uid, status, type);
        if (covers === null) {
            resp.message = 'Store not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store found';
        resp.data = covers;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}


let getKeywords = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };
    try {
        const store_id = req.params.uid;
        keywords = await storeModel.getStoreKeywords(store_id);
        if (keywords === null) {
            resp.message = 'Store keywords not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store keywords found';
        resp.data = keywords;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let addKeywords = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Add Keyword',
        errors: [],
        data: {}
    };
    try {


        keyword_id = await storeModel.addStoreKeyword(req.body);



        resp.status = true;
        resp.message = 'Keyword Added Successfully';
        resp.data = { keyword_id };
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }

}

let deleteKeywords = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Delete Keyword',
        errors: [],
        data: {}
    };

    const uid = req.params.uid;

    try {
        const deleted = await storeModel.deleteKeyword(uid);
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

}

let deleteStoreKeywords = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Delete Keyword',
        errors: [],
        data: {}
    };

    const uid = req.query.k_id;

    try {
        const deleted = await storeModel.deleteStore_Keywords(uid);
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

}

let getStoreComments = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: '',
        data: []
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;
        const status = req.query.status || 'all';

        const covers = await storeModel.getStoreComments(uid, status);
        if (covers === null) {
            resp.message = 'Store Comments found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store found';
        resp.data = covers;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let getAllStoreComments = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };
   
    try {
        const status = req.query.status || 'all';

        const covers = await storeModel.getAllStoreComments(status);
        if (covers === null) {
            resp.message = 'Store Comments found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store found';
        resp.data = covers;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let getCommentById = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: '',
        data: null
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;
        const comment = await storeModel.getCommentById(uid);
        if (comment === null) {
            resp.message = 'Store Comments found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store found';
        resp.data = comment;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}


let getStoreImageById = async (req, res) => {

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

        const image = await storeModel.getStoreImageById(uid);
        if (image === null) {
            resp.message = 'Store not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store found';
        resp.data = image;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let updateStoreImage = async (req, res) => {
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
            const filePath = `uploads/${req.body.imgType}_images/`;
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = await storeModel.updateStoreImage(uid, data);

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

const updateStoreImageRank = async (req, res) => {
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
        const uid = req.params.uid
        const rank = req.body.rank
        const store_id = req.body.store_id
        const type = req.body.type

        let updated = await storeModel.updateStoreImageRank(uid, rank, store_id, type);
        if (updated) {
            resp.status = true;
            resp.message = "Image Rank Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update Image Rank';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let updateStoreStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Store Status',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const updated = await storeModel.updateStoreStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Store Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store Status not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let updateStoreCommentStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Store Status',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const updated = await storeModel.updateStoreCommentStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Store Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store Status not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let updateStoreImageSatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Store Status',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const updated = await storeModel.updateStoreImageSatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Store Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store Status not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}
let getStoreById = async (req, res) => {
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
        // console.time()
        const uid = req.params.uid;
        const status = req.query.status || 'all';

        const store = await storeModel.getStoreById(uid, status);
        if (!store) {
            resp.message = 'Store not found';
            return res.status(200).json(resp);
        }

        // Fetch all required data in parallel
        const [
            details,
            metaData,
            metaKeywords,
            time,
            offer,
            address,
            categories,
            images,
            products,
            comments,
        ] = await Promise.all([
            storeModel.getStoreDetailsById(uid),
            storeModel.getStoreMetaDataById(uid),
            storeModel.getStoreMetaKeywordsById(uid),
            storeModel.getStoreTimeById(uid),
            storeModel.getStoreOfferById(uid),
            storeModel.getStoreAddressById(uid),
            storeModel.getStoreCategoriesById(uid),
            (async () => {
                return {
                    logo: await storeModel.getStoreImages(uid, 1, 'logo'),
                    gallery: await storeModel.getStoreImages(uid, 1, 'gallery'),
                    banner: await storeModel.getStoreImages(uid, 1, 'banner'),
                    cover: await storeModel.getStoreImages(uid, 1, 'cover'),
                    video: await storeModel.getStoreImages(uid, 1, 'video')
                };
            })(),
            ProductModel.getAllProducts(1, uid),
            storeModel.getStoreComments(uid, 1),
        ]);

        // Assign the data to the store object
        Object.assign(store, {
            details,
            metaData,
            metaKeywords,
            time,
            offer,
            address,
            categories,
            images,
            products,
            comments
        });
        // console.timeEnd()
        resp.status = true;
        resp.message = 'Store found';
        resp.data = store;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};


const updateStoreDeliveryCharges = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;
        const data = {
            title: req.body.deliveryTitle,
            charge: req.body.deliveryCharge,
        };
        const updated = await storeModel.updateStoreDeliveryCharges(uid, data);
        if (updated) {
            resp.status = true;
            resp.message = "Store Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const updateStoreGstCharges = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    try {
        const uid = req.params.uid;
        const data = {
            title: req.body.gstTitle,
            charge: req.body.gstCharge,
        };
        const updated = await storeModel.updateStoreGstCharges(uid, data);
        if (updated) {
            resp.status = true;
            resp.message = "Store Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}


const updateStoreRank = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store',
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
        const category_id = req.body.category_id


        let updated = await storeModel.updateStoreRank(uid, rank, category_id);


        if (updated) {
            resp.status = true;
            resp.message = "Store Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}

const addStore = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Add Store',
        errors: [],
        data: {}
    };
    // return res.status(200).json(req.body.isVerified);
    try {

        let store_data = {
            name: req.body.storeName,
            owner_name: req.body.ownerName,
            short_desc: req.body.storeShortDesc,
            long_desc: req.body.storeLongDesc,
            isVerified: req.body.isVerified,
            validityDate: req.body.validityDate,
            amountPaid: req.body.amountPaid
        }

        let store_address_data = {
            storeState: req.body.storeState,
            storeCity: req.body.storeCity,
            storeArea: req.body.storeArea,
            storeNearBy: req.body.storeNearBy,
            storePin: req.body.storePin
        }

        let store_whatsApp = {
            value: req.body.whatsApp,
            isEnabled: 1,
        }
        let store_Phone = {
            value: req.body.phoneNumber,
            isEnabled: 1,
        }

        const store_id = await storeModel.addStore(store_data);
        if (store_id) {
            const store_address_id = await storeModel.addStoreAddress(store_address_data, store_id);
            const isWhatsappNumbersAdded = await storeModel.addStoreDetails(store_whatsApp, store_id, 'whatsapp');
            const isPhoneNumbersAdded = await storeModel.addStoreDetails(store_Phone, store_id, 'phone');

            if (req.body.selectedSubCategories.length > 0) {
                await Promise.all(req.body.selectedSubCategories.map(async (item, index) => {
                    let isCategoryAdded = await storeModel.addStoreCategory(item.uid, item.type, store_id);
                }));
            }

            // if (req.body.whatsappNumbers.length > 0) {
            //     await Promise.all(req.body.whatsappNumbers.map(async (item, index) => {
            //         let isWhatsappNumbersAdded = await storeModel.addStoreDetails(item, store_id, 'whatsapp');
            //     }));
            // }

            // if (req.body.phoneNumbers.length > 0) {
            //     await Promise.all(req.body.phoneNumbers.map(async (item, index) => {
            //         let isPhoneNumbersAdded = await storeModel.addStoreDetails(item, store_id, 'phone');
            //     }));
            // }

            // if (req.body.googleMapLinks.length > 0) {
            //     await Promise.all(req.body.googleMapLinks.map(async (item, index) => {
            //         let isGoogleMapLinksAdded = await storeModel.addStoreDetails(item, store_id, 'map');
            //     }));
            // }

            // if (req.body.gmails.length > 0) {
            //     await Promise.all(req.body.gmails.map(async (item, index) => {
            //         let isGmailsAdded = await storeModel.addStoreDetails(item, store_id, 'mail');
            //     }));
            // }

            // if (req.body.youtubeLinks.length > 0) {
            //     await Promise.all(req.body.youtubeLinks.map(async (item, index) => {
            //         let isYoutubeLinksAdded = await storeModel.addStoreDetails(item, store_id, 'youtube');
            //     }));
            // }

            // if (req.body.facebookLinks.length > 0) {
            //     await Promise.all(req.body.facebookLinks.map(async (item, index) => {
            //         let isFacebookLinksAdded = await storeModel.addStoreDetails(item, store_id, 'facebook');
            //     }));
            // }

            // if (req.body.instagramLinks.length > 0) {
            //     await Promise.all(req.body.instagramLinks.map(async (item, index) => {
            //         let isInstagramLinksAdded = await storeModel.addStoreDetails(item, store_id, 'instagram');
            //     }));
            // }

            // if (req.body.twitterLinks.length > 0) {
            //     await Promise.all(req.body.twitterLinks.map(async (item, index) => {
            //         let isTwitterLinksAdded = await storeModel.addStoreDetails(item, store_id, 'twitter');
            //     }));
            // }

            // if (req.body.websiteLinks.length > 0) {
            //     await Promise.all(req.body.websiteLinks.map(async (item, index) => {
            //         let isWebsiteLinksAdded = await storeModel.addStoreDetails(item, store_id, 'website');
            //     }));
            // }

            if (req.body.storeTiming && req.body.storeTiming.length > 0) {
                await Promise.all(req.body.storeTiming.map(async (item, index) => {
                    let isStoreTimingAdded = await storeModel.addStoreTime(item, store_id);
                }));
            }

            resp.status = true;
            resp.message = 'Store Added Successfully';
            resp.data = { store_id: store_id };
        }


        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
};

const addStoreComment = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {

        let comment_data = {
            storeId: req.params.uid,
            userId: req.body.userId,
            comment: req.body.comment,
            rating: req.body.rating,
        }
        const isAdded = await storeModel.addStoreComment(comment_data);
        if (isAdded) {
            resp.status = true;
            resp.message = 'Comment Submited';
            resp.data = { store_id: store_id };
        }
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
}

let updateStoreCommentReply = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        let comment_data = {
            commentId: req.params.uid,
            reply: req.body.reply
        }
        const isAdded = await storeModel.updateStoreCommentReply(comment_data);
        if (isAdded) {
            resp.status = true;
            resp.message = 'Comment Submited';
        }
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let addStoreCover = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Store Cover',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
        const filePath = 'uploads/store_images/cover_images/';
        const path = await saveBase64File(base64Data, filePath);


        if (path) {
            let insert_data = {
                store_id,
                path,
                cover_title: req.body.cover_title,
            }
            let cover_id = await storeModel.addStoreCover(insert_data);
            resp.status = cover_id ? true : false;
            resp.message = cover_id ? 'Store Cover Added Successfully' : 'Cannot Add Store Cover';
            resp.data = { cover_id: cover_id };
        }

        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let addStoreLogo = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Store logo',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
        const filePath = 'uploads/store_images/logo_images/';
        const path = await saveBase64File(base64Data, filePath);

        if (path) {
            let insert_data = {
                store_id,
                path
            }
            let logo_id = await storeModel.addStoreLogo(insert_data);
            resp.status = logo_id ? true : false;
            resp.message = logo_id ? 'Store logo Added Successfully' : 'Cannot Add Store Logo';
            resp.data = { logo_id: logo_id };
        }

        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
}

let addStoreBanner = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Store Banners',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const isUpdated = await storeModel.increaseStoreImageRanks(store_id, req.body.images.length, 'banner')
        let isUploded = false
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/store_images/banner_images/';
            path = img.base64 != '' ? await saveBase64File(base64Data, filePath) : 'uploads/placeholder/placeholder.jpg';
            isUploded = await storeModel.addStoreBanner(img.title, img.linkText, path, store_id, index + 1);
        }));

        resp.status = isUploded ? true : false;
        resp.message = isUploded ? 'Store Banners Added Successfully' : 'Cannot Add Store Banners';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
}

let addStoreVideo = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Store Videos',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const isUpdated = await storeModel.increaseStoreImageRanks(store_id, req.body.images.length, 'video')
        let isUploded = false
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/store_images/banner_images/';
            path = img.base64 != '' ? await saveBase64File(base64Data, filePath) : 'uploads/placeholder/placeholder.jpg';
            isUploded = await storeModel.addStoreVideos(img.title, img.linkText, path, store_id, index + 1);
        }));

        resp.status = isUploded ? true : false;
        resp.message = isUploded ? 'Store Banners Added Successfully' : 'Cannot Add Store videos';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
}

let addStoreGallery = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: 'Cannot Add Store Banners',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const isUpdated = await storeModel.increaseStoreImageRanks(store_id, req.body.images.length, 'gallery')
        let isUploded = false
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/store_images/gallery_images/';
            path = img.base64 != '' ? await saveBase64File(base64Data, filePath) : 'uploads/placeholder/placeholder.jpg';
            isUploded = await storeModel.addStoreGallery(img.title, img.linkText, path, store_id, index + 1);
        }));

        resp.status = isUploded ? true : false;
        resp.message = isUploded ? 'Store Banners Added Successfully' : 'Cannot Add Store Banners';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let updateStore = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }


    try {
        const uid = req.params.uid;
        const storeData = {
            name: req.body.storeName,
            owner_name: req.body.ownerName,
            short_desc: req.body.storeShortDesc,
            long_desc: req.body.storeLongDesc,
            is_verified: req.body.isVerified,
            valid_till: req.body.validityDate,
            amount_paid: req.body.amountPaid

        };
        const storeAddressData = {
            storeArea: req.body.storeArea,
            storeCity: req.body.storeCity,
            storeNearBy: req.body.storeNearBy,
            storePin: req.body.storePin,
            storeState: req.body.storeState,
        }
        const updated = await storeModel.updateStore(uid, storeData);
        const addressDelete = await storeModel.deleteStoreAddress(uid);
        const updatedAddress = await storeModel.addStoreAddress(storeAddressData, uid);
        const selectedSubCategoriesDelete = await storeModel.deleteSelectedSubCategories(uid);
        if (req.body.selectedSubCategories.length > 0) {
            await Promise.all(req.body.selectedSubCategories.map(async (item, index) => {
                let isCategoryAdded = await storeModel.addStoreCategory(item.uid, item.type, uid);
            }));
        }
        // console.log(req.body.storeTiming)
        const storeTimingDelete = await storeModel.deleteStoreTiming(uid);
        if (req.body.storeTiming && req.body.storeTiming.length > 0) {
            await Promise.all(req.body.storeTiming.map(async (item, index) => {
                let isStoreTimingAdded = await storeModel.addStoreTime(item, uid);
            }));
        }
        if (updated) {
            resp.status = true;
            resp.message = "Store Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let deleteStore = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Delete Store',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;
    const c_id = req.query.c_id
    const pos = req.query.pos
    const pos_id = req.query.pos_id

    try {
        // Check for valid c_id and pos values
        if (c_id && c_id !== 'null' && c_id !== 'undefined' && pos && pos !== 'null' && pos !== 'undefined') {
            await storeModel.adjustStoreRanksAfterDelete(c_id, pos);
        }
        await storeModel.deleteStoreCategories(uid);
        const deleted = await storeModel.deleteStore(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Store Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let deleteStoreImage = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Delete Store',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const deleted = await storeModel.deleteStoreImage(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Store Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let deleteStoreComment = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Delete Store',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const deleted = await storeModel.deleteStoreComment(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Comment Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Store not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let addStoreMetaData = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Meta Data',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const data = req.body

        let meata_id = await storeModel.addStoreMetaData(store_id, data);
        if (req.body.keywords.length > 0) {
            await Promise.all(req.body.keywords.map(async (keyword, index) => {
                let isKeywordsAdded = await storeModel.addStoreKeywords(store_id, keyword);
            }));
        }

        resp.status = meata_id ? true : false;
        resp.message = meata_id ? 'Store Meta Data Added Successfully' : 'Cannot Add Store Meta Data';
        resp.data = { meata_id: meata_id };


        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
}

let addStoreOffer = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Meta Data',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const data = req.body

        let offer_id = await storeModel.addStoreOffer(store_id, data);

        resp.status = offer_id ? true : false;
        resp.message = offer_id ? 'Store Offer Added Successfully' : 'Cannot Add Store Offer';
        resp.data = { offer_id: offer_id };


        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let updateStoreDetails = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {


        const store_id = req.params.uid;
        const isDeleted = await storeModel.deleteStoreDetails(store_id);
        if (isDeleted) {
            if (req.body.whatsappNumbers.length > 0) {
                await Promise.all(req.body.whatsappNumbers.map(async (item, index) => {
                    let isWhatsappNumbersAdded = await storeModel.addStoreDetails(item, store_id, 'whatsapp');
                }));
            }

            if (req.body.phoneNumbers.length > 0) {
                await Promise.all(req.body.phoneNumbers.map(async (item, index) => {
                    let isPhoneNumbersAdded = await storeModel.addStoreDetails(item, store_id, 'phone');
                }));
            }

            if (req.body.googleMapLinks.length > 0) {
                await Promise.all(req.body.googleMapLinks.map(async (item, index) => {
                    let isGoogleMapLinksAdded = await storeModel.addStoreDetails(item, store_id, 'map');
                }));
            }

            if (req.body.gmails.length > 0) {
                await Promise.all(req.body.gmails.map(async (item, index) => {
                    let isGmailsAdded = await storeModel.addStoreDetails(item, store_id, 'mail');
                }));
            }

            if (req.body.youtubeLinks.length > 0) {
                await Promise.all(req.body.youtubeLinks.map(async (item, index) => {
                    let isYoutubeLinksAdded = await storeModel.addStoreDetails(item, store_id, 'youtube');
                }));
            }

            if (req.body.facebookLinks.length > 0) {
                await Promise.all(req.body.facebookLinks.map(async (item, index) => {
                    let isFacebookLinksAdded = await storeModel.addStoreDetails(item, store_id, 'facebook');
                }));
            }

            if (req.body.instagramLinks.length > 0) {
                await Promise.all(req.body.instagramLinks.map(async (item, index) => {
                    let isInstagramLinksAdded = await storeModel.addStoreDetails(item, store_id, 'instagram');
                }));
            }

            if (req.body.twitterLinks.length > 0) {
                await Promise.all(req.body.twitterLinks.map(async (item, index) => {
                    let isTwitterLinksAdded = await storeModel.addStoreDetails(item, store_id, 'twitter');
                }));
            }

            if (req.body.websiteLinks.length > 0) {
                await Promise.all(req.body.websiteLinks.map(async (item, index) => {
                    let isWebsiteLinksAdded = await storeModel.addStoreDetails(item, store_id, 'website');
                }));
            }
            if (req.body.upiLinks.length > 0) {
                await Promise.all(req.body.upiLinks.map(async (item, index) => {
                    let isUpiLinksAdded = await storeModel.addStoreDetails(item, store_id, 'upi');
                }));
            }

            if (req.body.others.length > 0) {
                await Promise.all(req.body.others.map(async (item, index) => {
                    let isOthersLinksAdded = await storeModel.addStoreDetails(item, store_id, 'others');
                }));
            }

            resp.status = true;
            resp.message = 'Store Updated Successfully';
            resp.data = { store_id: store_id };
        }


        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let updateStoreOffers = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const deleteOffer = await storeModel.deleteStoreOffers(store_id);
        const data = req.body
        let isUpdated = await storeModel.addStoreOffer(store_id, data);
        if (isUpdated) {
            resp.status = true;
            resp.message = 'Store Updated Successfully';
            resp.data = { store_id: store_id };
        }
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let updateStoreMetadata = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const store_id = req.params.uid;
        const deleteMetaData = await storeModel.deleteStoreMetaData(store_id);
        const deleteKeywords = await storeModel.deleteStoreKeywords(store_id);

        const data = req.body

        let meata_id = await storeModel.addStoreMetaData(store_id, data);
        if (req.body.keywords.length > 0) {
            await Promise.all(req.body.keywords.map(async (keyword, index) => {
                let isKeywordsAdded = await storeModel.addStoreKeywords(store_id, keyword);
            }));
        }
        resp.status = meata_id ? true : false;
        resp.message = meata_id ? 'Store Meta Data Added Successfully' : 'Cannot Add Store Meta Data';
        resp.data = { meata_id: meata_id };
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
}

let addStoreLeads = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;

        let isUpdated = await storeModel.addStoreLeads(data);

        if (!isUpdated) {
            resp.message = 'cannot Add Leades';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Added Leads';
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let updateStoreTimeStatus = async (req, res) => {
    let resp = {
        status: false,
        message: 'Internal server error',
        errors: [],
        data: {}
    };


    const status = req.body.is_opened;
    const uid = req.params.uid;
    try {
        const isUpdated = await storeModel.updateStoreTimeStatus(uid, status);

        if (isUpdated) {
            resp.status = true;
            resp.message = "Store Time Status Updated";
            return res.status(200).json(resp);
        }
        resp.message = "Cannot Update Store Time Status";
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};

let getStorePermissions = async (req, res) => {

    let resp = {
        status: false,
        message: '',
        data: {}
    };


    const type = req.query.t === 'v' ? 'vendor' : req.query.t === 'u' ? 'user' : '';

    try {
        const permissions = await storeModel.getStorePermissions(type);
        if (!permissions) {
            resp.message = 'Store not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Store Permissions found';
        resp.data = permissions;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let updateStorePermissions = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Store Permissions',
        errors: [],
        data: {}
    };

    try {
        const permissions = req.body;
        const type = req.query.t === 'v' ? 'vendor' : req.query.t === 'u' ? 'user' : '';

        const isUpdated = await storeModel.updateStorePermissions(permissions, type);
        if (isUpdated) {
            resp.status = true;
            resp.message = "Store Permissions Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update Store Permissions';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let getStoreLeads = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Fetch Store Leads',
        errors: [],
        data: {}
    };

    try {
        const querys = req.query;

        if (querys && querys.type) {
            const types = querys.type.split(',');
            const leadsData = [];

            for (const type of types) {
                // Fetch leads grouped by user_id
                const leads = await storeModel.getStoreLeadsByType(type, querys.store_id);

                if (leads && leads.length > 0) {
                    // Fetch user data for each user_id
                    for (const lead of leads) {
                        const user = await userModel.getUserById(lead.user_id);
                        lead.user = user || null; // Add user data or null if not found
                    }

                    leadsData.push({ type, leads });
                } else {
                    leadsData.push({ type, leads: [] });
                }
            }

            resp.status = true;
            resp.message = 'Leads fetched successfully';
            resp.data = leadsData;

            return res.status(200).json(resp);
        } else {
            resp.message = 'Invalid query parameters';
            return res.status(400).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};


let getStoreFollowers = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot fetch store followers',
        errors: [],
        data: {}
    };

    try {
        const uid = req.params.uid; // Get the store ID from the URL params

        // Fetch followers for the store
        const followers = await storeModel.getStoreFollowers(uid);

        // If followers exist, fetch user data for each user_id
        if (followers && followers.length > 0) {
            const userPromises = followers.map(async (follower) => {
                const user = await userModel.getUserById(follower.user_id);
                // Add user data or null if user not found
                follower.user = user || null;
                return follower;
            });

            // Wait for all user data to be fetched and update the followers
            const updatedFollowers = await Promise.all(userPromises);
            resp.data = updatedFollowers; // Set updated followers with user data
        }

        // If no followers found, send a message accordingly
        if (!followers || followers.length === 0) {
            resp.message = 'No followers found for this store';
        } else {
            resp.status = true;
            resp.message = 'Followers fetched successfully';
        }

        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};


let getStoreAnalitycs = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot fetch store analytics',
        errors: [],
        data: {}
    };

    try {
        const uid = req.params.uid; // Get the store ID from the URL params

        // Fetch analytics for the store
        const analytics = await storeModel.getStoreAnalytics(uid);

        // If analytics exist, send them
        if (analytics) {
            resp.status = true;
            resp.message = 'Analytics fetched successfully';
            resp.data = analytics;
        } else {
            resp.message = 'No analytics found for this store';
        }

        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}


let getStoreLeadsCallsChats = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot fetch store leads calls chats',
        errors: [],
        data: {},
    };

    try {
        let { page = 1, limit = 1000 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        let offset = (page - 1) * limit;

        // Fetch total count for pagination
        const totalRecords = await storeModel.getStoreLeadsCallsChatsCount();

        // Fetch paginated leads, sorted by latest_created_at
        const whatsApp = await storeModel.getStoreLeadsCallsChats(limit, offset, 'whatsapp');
        const phone = await storeModel.getStoreLeadsCallsChats(limit, offset, 'phone');

        if (phone.length > 0 || whatsApp.length > 0) {
            resp.status = true;
            resp.message = 'Leads, calls, and chats fetched successfully';
            resp.data = {
                leads: {
                    whatsApp,
                    phone,
                },
                pagination: {
                    totalRecords,
                    totalPages: Math.ceil(totalRecords / limit),
                    currentPage: page,
                    limit,
                },
            };
        } else {
            resp.message = 'No leads, calls, and chats found for this store';
        }

        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
};




module.exports = {
    getStoreAnalitycs,
    getStoreLeadsCallsChats,
    addStore,
    addStoreLeads,
    addStoreCover,
    addStoreBanner,
    addStoreGallery,
    addStoreLogo,
    getStoreById,
    getStoreImages,
    addStoreOffer,
    addStoreMetaData,
    updateStoreRank,
    getAllStores,
    updateStore,
    deleteStore,
    deleteStoreImage,
    updateStoreStatus,
    updateStoreImageSatus,
    updateStoreDetails,
    updateStoreOffers,
    updateStoreMetadata,
    getStoreImageById,
    updateStoreImage,
    updateStoreImageRank,
    updateStoreDeliveryCharges,
    updateStoreGstCharges,
    addStoreComment,
    getStoreComments,
    updateStoreCommentStatus,
    deleteStoreComment,
    saveStore,
    followStore,
    searchStores,
    getCommentById,
    updateStoreCommentReply,
    getKeywords,
    addKeywords,
    deleteKeywords,
    deleteStoreKeywords,
    searchStoresByKeyWords,
    addStoreVideo,
    getAllStoreComments,
    updateStoreTimeStatus,
    getStorePermissions,
    updateStorePermissions,
    getStoreLeads,
    getStoreFollowers
};
