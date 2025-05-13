const bannerModel = require('../models/bannerModel');
const { validationResult } = require('express-validator');
const { saveBase64File } = require('../utils/fileUplode')


let getAllBanners = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };

    try {
        const status = req.query.status || 'all';
        const allData = await bannerModel.getAllBanners(status);
        if (allData == null) {
            resp.message = 'NO BANNER FOUND';
            return res.status(200).json(resp);
        } else {
            await Promise.all(allData.map(async (img, index) => {
                allData[index].banners = await bannerModel.getAllBannersImages(img.uid);
            }));

            resp.status = true;
            resp.message = "Banner list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = error;
        return res.status(500).json(resp);
    }
}

let getCategoryBannerImages = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: '',
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const category_uid = req.params.uid;
    const status = req.query.status || 'all';
    try {
        const banner = await bannerModel.getCategoryBannerImages(category_uid, status);
        if (banner === null) {
            resp.message = 'Banner not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Banner found';
        resp.data = banner;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let getBannerById = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: '',
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    try {
        const banner = await bannerModel.getBannerById(uid);
        if (banner === null) {
            resp.message = 'Banner not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Banner found';
        resp.data = banner;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let getCategoryBannerImagesById = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: '',
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    try {
        const banner = await bannerModel.getCategoryBannerImagesById(uid);
        if (banner === null) {
            resp.message = 'Banner not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Banner found';
        resp.data = banner[0];
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

const addBanner = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Add Banner',
        errors: [],
        data: {}
    };

    try {


        const banner_id = await bannerModel.addBanner(req.body);

        let isUploded = false
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/banner_images/';
            path = await saveBase64File(base64Data, filePath);

            isUploded = await bannerModel.addBannerImages(path, banner_id, index + 1, img.title, img.linkText, img.youtubeLink);
        }));

        if (isUploded) {
            resp.status = true;
            resp.message = 'Banners Added Successfully';
            resp.data = { banner_id: banner_id };
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Add Banners';
            return res.status(200).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }
};

let updateBanner = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const uid = req.params.uid;

    try {
        const bannerData = {
            title: req.body.title,
            type: req.body.type,
            position: req.body.position,
            status: req.body.isActive
        };

        const updated = await bannerModel.updateBanner(uid, bannerData);
        if (updated) {
            resp.status = true;
            resp.message = "Banner Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}

let deleteBanner = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: 'Cannot Delete Banner',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;

    try {
        const deleted = await bannerModel.deleteBanner(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Banner Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let updateBannerStatus = async (req, res) => {
    const errors = validationResult(req);

    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    try {
        const updated = await bannerModel.updateBannerStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Banner Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Status not Updated';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const getBannersImages = async (req, res) => {
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
        const banners = await bannerModel.getBannersImages(uid, status);
        const banner = await bannerModel.getBannerById(uid);
        if (banners) {
            resp.status = true;
            resp.message = "Banner Images Found";
            resp.bannerData = banner
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

const updateBannerImageStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    try {
        const updated = await bannerModel.updateBannerImageStatus(uid);
        if (updated) {
            resp.status = true;
            resp.message = "Banner Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Status not Updated';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const updateCategoryBannerStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    try {
        const updated = await bannerModel.updateCategoryBannerStatus(uid);
        // console.log(updated)
        if (updated) {
            resp.status = true;
            resp.message = "Banner Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Status not Updated';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const updateCategoryBannerImagesStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }
    const uid = req.params.uid;
    try {
        const updated = await bannerModel.updateCategoryBannerImagesStatus(uid);
        // console.log(updated)
        if (updated) {
            resp.status = true;
            resp.message = "Banner Status Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Status not Updated';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const addBannerImages = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }


    try {

        const banner_id = req.params.uid;
        const isUpdated = await bannerModel.increaseBannerImageRanks(banner_id, req.body.images.length)
        let isUploded = false
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/banner_images/';
            path = await saveBase64File(base64Data, filePath);

            isUploded = await bannerModel.addBannerImages(path, banner_id, index + 1, img.title, img.linkText, img.youtubeLink);
        }));

        if (isUploded) {
            resp.status = true;
            resp.message = 'Banners Added Successfully';
            resp.data = { banner_id: banner_id };
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Add Banners';
            return res.status(200).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }


}

const updateBannerImage = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    const uid = req.params.uid;

    try {
        let data = {
            title: req.body.title,
            link: req.body.link,
            youtube_link: req.body.youtube_link,
        }
        if (req.body.image.path) {
            data.path = req.body.image.path
        } else {
            const base64Data = req.body.image.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/banner_images/';
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = await bannerModel.updateBannerImage(uid, data);

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
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}

let updateCategoryBannerImage = async (req, res) => {

    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    const uid = req.params.uid;

    try {
        let data = {
            title: req.body.title,
            url: req.body.link,
            category_id: req.body.category,
            youtubeLink: req.body.youtubeLink,
        }
        if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/category_banner_images/';
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = await bannerModel.updateCategoryBannerImage(uid, data);

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
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }


}

const deleteBannerImage = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot delete Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    const uid = req.params.uid;

    try {
        const deleted = await bannerModel.deleteBannerImage(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Banner Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}

const deleteCategoryBannerImage = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot delete Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    const uid = req.params.uid;

    try {
        const deleted = await bannerModel.deleteCategoryBannerImage(uid);
        if (deleted) {
            resp.status = true;
            resp.message = "Banner Deleted";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner not found';
            return res.status(404).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const getBannerImageById = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot delete Banner',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    const uid = req.params.uid;

    try {
        const banners = await bannerModel.getBannerImageById(uid);
        if (banners) {
            resp.status = true;
            resp.message = "Banner Image Found";
            resp.data = banners[0]
            return res.status(200).json(resp);
        } else {
            resp.message = 'Banner Image Not Found';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}

const updateBannerRank = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Banner Rank',
        errors: [],
        data: {}
    };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        const uid = req.params.uid
        const rank = req.body.rank
        const page = req.body.page

        // console.log(rank)

        let updated = await bannerModel.updateBannerRank(uid, rank, page);
        if (updated) {
            resp.status = true;
            resp.message = "Banner Rank Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update Banner Rank';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}

const updateBannerImageRank = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Update Banner Image Rank',
        errors: [],
        data: {}
    };

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        const uid = req.params.uid
        const rank = req.body.rank
        const banner_id = req.body.banner_id

        // console.log(rank)

        let updated = await bannerModel.updateBannerImageRank(uid, rank, banner_id);
        if (updated) {
            resp.status = true;
            resp.message = "Banner Image Rank Updated";
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update Banner Image Rank';
            return res.status(404).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

const addCategoryBanner = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Add Banner',
        errors: [],
        data: {}
    };

    try {

        const category_id = req.params.uid

        let isUploded = false
        let data = {}
        await Promise.all(req.body.images.map(async (img, index) => {
            const base64Data = img.base64.replace(/^data:image\/\w+;base64,/, '');
            const filePath = 'uploads/category_banner_images/';
            data = {
                path: await saveBase64File(base64Data, filePath),
                title: img.title,
                link: img.linkText,
                youtubeLink: img.youtubeLink
            }

            isUploded = await bannerModel.addCategoryBanner(data, category_id);
        }));

        if (isUploded) {
            resp.status = true;
            resp.message = 'Banners Added Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Add Banners';
            return res.status(200).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(200).json(resp);
    }

}
module.exports = {
    addBanner,
    getCategoryBannerImages,
    getBannerById,
    getAllBanners,
    updateBanner,
    deleteBanner,
    updateBannerStatus,
    getBannersImages,
    updateBannerImageStatus,
    addBannerImages,
    deleteBannerImage,
    deleteCategoryBannerImage,
    getBannerImageById,
    updateBannerImage,
    updateBannerRank,
    updateBannerImageRank,
    addCategoryBanner,
    getCategoryBannerImagesById,
    updateCategoryBannerImage,
    updateCategoryBannerStatus,
    updateCategoryBannerImagesStatus
}
