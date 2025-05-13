const usersModel = require('../models/userModel')
const productModel = require('../models/productModel')
const storeModel = require('../models/storeModel')
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // import JWT
const config = require('../config/config');
const { saveBase64File } = require('../utils/fileUplode')
const { sendOtp } = require('../utils/otp');

let index = async (req, res) => {
    res.status(500).json(
        {
            success: true,
            message: 'api Server Running',
        }
    );
};

let getAllOrder = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };

    try {

        let store_id = req.query.s
        // Fetch all user orders
        let orders = await usersModel.getAllOrder(store_id);

        // Check if orders exist
        if (!orders || orders.length === 0) {
            resp.message = 'No orders found for this user';
            return res.status(404).json(resp);
        }

        // console.time();

        // Fetch order details concurrently using Promise.all
        const orderDetailsPromises = orders.map(async (item) => {
            const order = await usersModel.getOrderDetails(item.uid);

            if (!order) {
                throw new Error('Order not found');
            }

            // Fetch product, user, and address concurrently for each order
            const [product, user, store] = await Promise.all([
                productModel.getProductById(order.product_id),
                usersModel.getUserById(order.user_id),
                storeModel.getStoreByProductId(order.product_id)
            ]);

            if (user) {
                user.address = await usersModel.getUserAddress(user.uid);
            }

            // Attach product and user to the order object
            order.product = product;
            order.user = user;
            order.store = store
            return order;
        });

        // Await all promises to resolve
        const detailedOrders = await Promise.all(orderDetailsPromises);

        // console.timeEnd();

        resp.status = true;
        resp.message = 'Orders found';
        resp.data = detailedOrders;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = error.message || 'Internal server error';
        return res.status(500).json(resp);
    }
};




let getAllUser = async (req, res) => { // created by sovon. use for call all the users
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    let type = req.query.type
    let status = req.query.status || ''
    let vendor_status = req.query.vendor_status || ''

    try {
        const allData = await usersModel.getAllUser(type, status, vendor_status);
        if (allData == null) {
            resp.message = 'NO USER FOUND';
            return res.status(200).json(resp);
        } else {
            if (type === 'vendor') {
                for (let user of allData) {
                    user.store_id = await usersModel.getVendorStore(user.uid);
                }
            }
            resp.status = true
            resp.message = "User list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }
}

let getVendorScoialStatus = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    try {
        const status = await usersModel.getVendorScoialStatus();
        if (status == null) {
            resp.message = 'NO USER FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "User list found";
            resp.detailsIsShow = status;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }

}

let updateOrderStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Internal server error',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }
    const status = req.body.status
    const uid = req.params.uid;
    try {
        const isUpdated = await usersModel.updateOrderStatus(uid, status);

        if (isUpdated) {
            resp.status = true
            resp.message = "Order Status Updated";
            return res.status(200).json(resp);
        }
        resp.message = "Cannot Update Order Status ";
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let updateVendorScoialStatus = async (req, res) => {
    let resp = {
        status: false,
        message: 'Internal server error',
        errors: [],
        data: {}
    };
    const status = req.body.SocialCountStatus

    try {
        const isUpdated = await usersModel.updateVendorScoialStatus(status);

        if (isUpdated) {
            resp.status = true
            resp.message = "Status Updated";
            return res.status(200).json(resp);
        }
        resp.message = "Cannot Update Status ";
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}


let updateVendorAccess = async (req, res) => {

    let resp = {
        status: false,
        message: 'Internal server error',
        errors: [],
        data: {}
    };
    const type = req.body.type
    const status = req.body.status
    const uid = req.params.uid

    try {
        const isUpdated = await usersModel.updateVendorAccess(uid, status, type);

        if (isUpdated) {
            resp.status = true
            resp.message = "Status Updated";
            return res.status(200).json(resp);
        }
        resp.message = "Cannot Update Status ";
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}


let getNotification = async (req, res) => {

    let resp = {
        status: false,
        message: '404',
        data: []
    };

    try {
        let user_id = req.params.uid
        const adminnotification = await usersModel.getNotification(user_id) ?? [];
        const vendorNotification = await usersModel.getVendorNotification(user_id) ?? [];
        const notification = [...adminnotification, ...vendorNotification]
        if (notification.length == 0) {
            resp.message = 'NO notification FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "User notification found";
            resp.data = notification;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }

}

let getQueries = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    try {

        let store_id = req.query.s

        const allData = await usersModel.getQueries(store_id);
        if (allData == null) {
            resp.message = 'NO Queries FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "Queries list found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }
}

let getUserById = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const user = await usersModel.getUserById(uid);
        // console.log(user)
        if (user.type == 'admin') {
            const q = req.query.q
            if (q == 'v') {
                user.seoVendorDetails = await usersModel.getAdminVendorSeo();
            }
            user.seoDetails = await usersModel.getAdminSeo();
            user.socialDetails = await usersModel.getAdminSocial();
        } else if (user.type == 'user') {
            user.address = await usersModel.getUserAddress(uid);
        } else if (user.type == 'vendor') {
            user.store_id = await usersModel.getVendorStore(uid);
        }
        if (user === null) {
            // User not found with the given UID
            resp.message = 'User not found';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'User found';
        resp.data = user;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let getVendorStore = async (req, res) => {

    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const store_id = await usersModel.getVendorStore(uid);
        if (store_id) {
            resp.status = true;
            resp.message = 'User found';
            resp.store_id = store_id;
            return res.status(200).json(resp);
        }
        resp.message = 'User not found';
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}


let getOrderDetails = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const order = await usersModel.getOrderDetails(uid);

        if (!order) {
            // User not found with the given UID
            resp.message = 'Order not found';
            return res.status(200).json(resp);
        }
        order.product = await productModel.getProductById(order.product_id)
        order.product.images = await productModel.getProductImages(order.product_id, 1)
        order.store = await storeModel.getStoreById(order.product.store_id, 1)
        order.user = await usersModel.getUserById(order.user_id)
        order.user.address = await usersModel.getUserAddress(order.user_id)
        resp.status = true;
        resp.message = 'Order found';
        resp.data = order;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}


let getUserOrders = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };
    const uid = req.params.uid;

    try {
        // Fetch user orders
        let orders = await usersModel.getUserOrders(uid);

        // Check if orders exist
        if (!orders || orders.length === 0) {
            resp.message = 'No orders found for this user';
            return res.status(404).json(resp);
        }

        // console.time()
        // Use Promise.all to fetch order details concurrently
        const orderDetailsPromises = orders.map(async (item) => {
            const order = await usersModel.getOrderDetails(item.uid);

            if (!order) {
                throw new Error('Order not found');
            }

            // Fetch additional details concurrently
            // Fetch product and user details
            order.product = await productModel.getProductById(order.product_id);
            order.product.images = await productModel.getProductImages(order.product_id, 1)
            order.user = await usersModel.getUserById(order.user_id);
            order.user.address = await usersModel.getUserAddress(order.user_id);

            // Fetch store details
            order.store = await storeModel.getStoreById(order.product.store_id, 1);

            // Check if the store exists before trying to access its details
            if (order.store) {
                order.store.details = await storeModel.getStoreDetailsById(order.product.store_id);
            } else {
                order.store = { details: [] }; // Initialize store with empty details if not found
            }

            return order;
        });

        // Await all promises to resolve
        const detailedOrders = await Promise.all(orderDetailsPromises);

        // console.timeEnd()
        resp.status = true;
        resp.message = 'Orders found';
        resp.data = detailedOrders;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = error.message || 'Internal server error';
        return res.status(500).json(resp);
    }
}


let placeOrder = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    const uid = req.params.uid;
    try {
        const placeOrder = await usersModel.placeOrder(uid);

        if (!placeOrder) {
            // User not found with the given UID
            resp.message = 'Order Not Placed';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Order Placed';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let getSiteDetails = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };
    try {


        socialDetails = await usersModel.getAdminSocial();
        seoDetails = await usersModel.getAdminSeo();

        if (socialDetails && seoDetails) {
            resp.status = true;
            resp.message = 'data found';
            resp.data = {
                socialDetails: socialDetails,
                seoDetails: seoDetails
            };
            return res.status(200).json(resp);
        }
        // User not found with the given UID
        resp.message = 'data not found';
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let handleAdminLogin = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot find Admin',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const user = await usersModel.getUserByEmail(req.body.email, 'admin');

        if (user && await bcrypt.compare(req.body.password, user.password)) {
            // Token generate 
            const token = jwt.sign({ id: user.id, role: 'admin' }, config.jwt_token, { expiresIn: '1h' });

            resp.status = true;
            resp.message = 'Login successful';
            resp.data = { user, token }; // send token in response
            return res.status(200).json(resp);
        }
        resp.message = 'User not found';
        return res.status(404).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let handleUserSignUp = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add User',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        const user = await usersModel.getUserByPhone(req.body.phoneNumber, 'user');
        if (user !== null) {
            resp.errors.push({ msg: 'Phone Number Already Exists Try Different' });
            return res.status(200).json(resp);
        } else {
            const salt = bcrypt.genSaltSync(10);
            req.body.password = await bcrypt.hash(req.body.password, salt)
            const user_id = await usersModel.addNewUser(req.body, 'user')
            if (user_id) {
                let sendOtp = await usersModel.generateNewOtp(user_id)
                if (sendOtp) {
                    resp.status = true
                    resp.message = "New User Added"
                    resp.data = { 'user_id': user_id };
                    return res.status(200).json(resp);
                } else {
                    return res.status(500).json(resp);
                }
            } else {
                return res.status(200).json(resp);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}





let verifyOtp = async (req, res) => {
    let resp = {
        status: false,
        message: 'Otp Not Matched',
        errors: [],
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        let isMatched = await usersModel.verifyOtp(req.body.otp, req.body.user_id)

        // demo user otp
        if (req.body.user_id == 'e2fa4e1abc3c8a83' && req.body.otp == '1234') {
            isMatched = true
        }else if(req.body.user_id == 'bb330761139c55dc' && req.body.otp == '1234'){
            isMatched = true
        }

        if (isMatched) {
            let user = await usersModel.getUserById(req.body.user_id)
            const token = jwt.sign({ id: req.body.user_id, role: user.type }, config.jwt_token, { expiresIn: '24h' });
            resp.status = true
            resp.message = "Otp matched"
            resp.token = token
            resp.user = user;
            return res.status(200).json(resp);
        }
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}

let handleUserLogin = async (req, res) => {
    let resp = {
        status: false,
        message: 'User not found',
        errors: [],
        data: {}
    };
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        const user = await usersModel.getUserByEmail(req.body.email, req.body.type);
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const token = jwt.sign({ id: user.uid, role: 'user' }, config.jwt_token, { expiresIn: '24h' });
            resp.status = true;
            resp.message = 'Login successful';
            resp.data = { user, token }; // send token in response
            return res.status(200).json(resp);
        }
        return res.status(404).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}

let handleUserSignIn = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Add User',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(200).json(resp);
    }

    try {
        const user = await usersModel.getUserByPhone(req.body.phoneNumber, req.body.type);
        if (user !== null) {
            const token = jwt.sign({ id: user.uid, role: req.body.type }, config.jwt_token, { expiresIn: '24h' });
            let otp = await usersModel.generateNewOtp(user.uid)
            if (otp) {
                await sendOtp(req.body.phoneNumber, otp)
                resp.status = true;
                resp.message = 'Signin successful';
                resp.data = { user, token, type: 'oldUser' };
                return res.status(200).json(resp);
            }
        } else {
            if (req.body.type != 'vendor') {
                const user_id = await usersModel.addNewUser(req.body, req.body.type)
                if (user_id) {
                    let otp = await usersModel.generateNewOtp(user_id)
                    if (otp) {
                        await sendOtp(req.body.phoneNumber, otp)
                        resp.status = true
                        resp.message = "New User Added"
                        resp.data = { 'user_id': user_id, type: 'newUser' };
                        return res.status(200).json(resp);
                    } else {
                        return res.status(500).json(resp);
                    }
                } else {
                    return res.status(200).json(resp);
                }
            } else {
                resp.message = 'Vendor not found';
                return res.status(200).json(resp);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let resendOtp = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot Sent OTP',
        errors: [],
        data: {}
    };

    try {
        const user = await usersModel.getUserById(req.body.user_id);
        if (user !== null) {
            let otp = await usersModel.generateNewOtp(user.uid)
            if (otp) {
                await sendOtp(user.phone, otp)
                resp.status = true;
                resp.message = `OTP Sent to ${user.phone}`;
                return res.status(200).json(resp);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
    return res.status(500).json(resp);
}

let getUserStores = async (req, res) => {
    let resp = {
        status: false,
        message: 'User not found',
        errors: [],
        data: {}
    };
    let user_id = req.params.uid

    try {
        const savedStores = await usersModel.getUserStores(user_id) || []
        resp.status = true;
        resp.message = 'Stores Fetched';
        resp.data = savedStores;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}

let getUserStoresList = async (req, res) => {
    let resp = {
        status: false,
        message: 'User not found',
        errors: [],
        data: {}
    };
    let user_id = req.params.uid

    try {
        const savedStores = await usersModel.getUserStoresList(user_id) || []




        resp.status = true;
        resp.message = 'Stores Fetched';
        resp.data = savedStores;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}

let getUserStoresFollowes = async (req, res) => {
    let resp = {
        status: false,
        message: 'User not found',
        errors: [],
        data: {}
    };
    let user_id = req.params.uid

    try {
        const savedStores = await usersModel.getUserStoresFollowes(user_id) || []

        // Fetch stores with images in parallel
        const storePromises = savedStores.map(async (store_id) => {
            try {
                // Fetch store details
                const store = await storeModel.getStoreById(store_id, 1);
                if (!store) return null;

                // Fetch store images
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
        resp.message = 'Stores Fetched';
        resp.data = savedStores;
        resp.stores = validStores
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}
let updateUser = async (req, res) => {
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
            name: req.body.name,
            email: req.body.email,
            password: req.body.password || '',
            path: ''
        };

        if (req.body.path) {
            data.path = req.body.path;
        } else if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = `uploads/user_images/`;
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = await usersModel.updateUser(uid, data);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'User Updated Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update User';
            return res.status(500).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};

let updateUserDetails = async (req, res) => {
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
            name: req.body.name,
            phone: req.body.phone,
            gender: req.body.gender,
            path: ''
        };

        let addressData = {
            localArea: req.body.localArea,
            city: req.body.city,
            state: req.body.state,
            pincode: req.body.pincode,
            landmark: req.body.landMark
        }

        if (req.body.path) {
            data.path = req.body.path;
        } else if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = `uploads/user_images/`;
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = await usersModel.updateUserDetails(uid, data);
        isUpdated = await usersModel.updateUserDetailsAddress(uid, addressData);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'User Updated Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update User';
            return res.status(500).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }


}

let updateUserSeo = async (req, res) => {
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
        const q = req.query.q
        let data = {
            name: req.body.name,
            storeState: req.body.storeState,
            storeCity: req.body.storeCity,
            storeCountry: req.body.storeCountry,
            storeContinent: req.body.storeContinent,
            copyWrite: req.body.copyWrite,
            metaTitle: req.body.metaTitle,
            metaDesc: req.body.metaDesc,
            keywords: req.body.keywords,
            seoId: req.body.seoId,
            path: ''
        };

        if (q == 'v') {
            data.websiteLink = req.body.websiteLink
            data.appStoreLink = req.body.appStoreLink
            data.playStoreLink = req.body.playStoreLink
        }

        if (req.body.path) {
            data.path = req.body.path;
        } else if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = `uploads/logo_images/`;
            data.path = await saveBase64File(base64Data, filePath);
        }

        let isUpdated = false;

        if (q == 'v') {
            isUpdated = await usersModel.updateUserVendorSeo(data);
        } else {
            isUpdated = await usersModel.updateUserSeo(data);
        }


        if (isUpdated) {
            resp.status = true;
            resp.message = 'User Updated Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update User';
            return res.status(500).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let addUserName = async (req, res) => {
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
        const userName = req.body.userName
        const gender = req.body.gender


        let isUpdated = await usersModel.addUserName(userName, gender, uid);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'User Name Successfully';
            return res.status(200).json(resp);
        } else {
            resp.message = 'Cannot Update User';
            return res.status(500).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let updateUserSocial = async (req, res) => {
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
        const socialDetails = req.body;

        // console.log(socialDetails)

        let isUpdated = await usersModel.updateUserSocialDetails(socialDetails);

        if (!isUpdated) {
            resp.message = 'Cannot update user social contacts';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'User social contacts updated successfully';
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};

let addLeads = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;

        let isUpdated = await usersModel.addLeads(data);

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


let addEnquiry = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;

        let isUpdated = await usersModel.addEnquiry(data);

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


let addNewOrder = async (req, res) => {

    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;

        let orderId = await usersModel.addNewOrder(data);
        let isAddress = await usersModel.getUserAddress(data.userId)

        if (!orderId) {
            resp.message = 'cannot Add Order';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Added Order';
        resp.data.orderId = orderId
        resp.data.isAddress = isAddress ? true : false
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }

}

let addUserAddess = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;

        let isAdded = await usersModel.addUserAddess(data);

        if (!isAdded) {
            resp.message = 'cannot Add Order';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Added Address';
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let addVendor = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;

        let isVendor = await usersModel.isVendor(data);
        if (isVendor) {
            resp.message = 'Phone Number AllReady Exists Try Diffrent';
            return res.status(200).json(resp);
        }

        if (req.body.file) {
            const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
            const filePath = `uploads/user_images/`;
            data.path = await saveBase64File(base64Data, filePath);
        } else {
            data.path = ''
        }

        let vendor_id = await usersModel.addVendor(data);
        if (vendor_id) {

            let vendor_address = {
                vendorArea: '',
                vendorCity: '',
                vendorState: '',
                vendorPin: ''
            }

            await usersModel.addVendorAddress(vendor_address, vendor_id);
            let store_data = {
                name: req.body.storeName,
                owner_name: req.body.name,
                short_desc: '',
                long_desc: '',
                isVerified: '',
                validityDate: '',
                amountPaid: ''
            }
            const store_id = await storeModel.addStore(store_data);
            let store_Phone = {
                value: req.body.phone,
                isEnabled: 1,
            }
            await storeModel.addStoreDetails(store_Phone, store_id, 'phone');
            let store_address_data = {
                storeState: '',
                storeCity: '',
                storeArea: '',
                storeNearBy: '',
                storePin: ''
            }
            await storeModel.addStoreAddress(store_address_data, store_id);
            await storeModel.addVendorStore(vendor_id, store_id)
        }


        if (!vendor_id) {
            resp.message = 'cannot Add Vendor';
            return res.status(200).json(resp);
        }

        if (vendor_id) {
            let otp = await usersModel.generateNewOtp(vendor_id)
            if (otp) {
                await sendOtp(req.body.phone, otp)
                resp.status = true
                resp.message = "New User Added"
                resp.data = { 'user_id': vendor_id, type: 'newUser' };
                return res.status(200).json(resp);
            } else {
                return res.status(500).json(resp);
            }
        } else {
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let updateVendorStatus = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Internal server error',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    const status = req.body.status == 1 ? 'active' : 'inactive';
    const uid = req.params.uid;
    try {
        const isUpdated = await usersModel.updateVendorStatus(uid, status);

        if (isUpdated) {
            resp.status = true;
            resp.message = "Vendor Status Updated";
            return res.status(200).json(resp);
        }
        resp.message = "Cannot Update Vendor Status";
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
};

let getLeads = async (req, res) => {
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
    let item_id = req.params.uid

    try {
        const leads = await usersModel.getLeadsbyItem(item_id) || []
        resp.status = true;
        resp.message = 'Stores Fetched';
        resp.data = leads;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }

}

let getSearchLeads = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };
    try {
        const leads = await usersModel.getSearchLeads() || 0
        resp.status = true;
        resp.message = 'Leads Fetched';
        resp.data = leads;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }

}

let getUserClicks = async (req, res) => {
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
    let item_id = req.params.uid

    try {
        const leads = await usersModel.getLeadsbyUser(item_id) || []
        resp.status = true;
        resp.message = 'Stores Fetched';
        resp.data = leads;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }

}

let deleteNotification = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    try {
        let user_id = req.params.uid
        const allData = await usersModel.deleteNotification(user_id);
        if (allData == null) {
            resp.message = 'NO notification FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "User notification found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }
}

let deleteUser = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    try {
        let user_id = req.params.uid
        let type = req.query.u
        const allData = await usersModel.deleteUser(user_id);
        if (allData == null) {
            resp.message = 'User Not Deleted';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "User Deleted";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }


}


let deleteVendorNotification = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    try {
        let user_id = req.params.uid
        const allData = await usersModel.deleteVendorNotification(user_id);
        if (allData == null) {
            resp.message = 'NO notification FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "User notification found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }
}


let getuserStoreLeads = async (req, res) => {

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
            let leadsData = [];

            for (const type of types) {
                // Fetch leads grouped by user_id
                const leads = await storeModel.getUserStoreLeadsByType(type, querys.store_id, querys.user_id);
                leadsData.push({ type, leads });
            }

            resp.status = true;
            resp.message = 'Leads fetched successfully';
            resp.userData = await usersModel.getUserById(querys.user_id)
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

}

let addMember = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: {}
    };

    try {
        const data = req.body;
        // Save the base64 image to a file
        const base64Data = data.images.replace(/^data:image\/\w+;base64,/, '');
        const filePath = 'uploads/team_images/';
        const path = await saveBase64File(base64Data, filePath);
        data.path = path;

        let isAdded = await usersModel.addMember(data);

        if (!isAdded) {
            resp.message = 'cannot Add Member';
            return res.status(200).json(resp);
        }
        resp.status = true;
        resp.message = 'Added Member';
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal server error';
        return res.status(500).json(resp);
    }
}

let getMember = async (req, res) => {
    let resp = {
        status: false,
        message: '',
        data: []
    };

    try {
        const members = await usersModel.getMembers() || []
        resp.status = true;
        resp.message = 'Members Fetched';
        resp.data = members;
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error });
        return res.status(500).json(resp);
    }
}

let deleteMembers = async (req, res) => {
    let resp = {
        status: false,
        message: '404',
        data: []
    };
    try {
        let user_id = req.params.uid
        const allData = await usersModel.deleteMembers(user_id);
        if (allData == null) {
            resp.message = 'NO Members FOUND';
            return res.status(200).json(resp);
        } else {
            resp.status = true
            resp.message = "Members found";
            resp.data = allData;
            return res.status(200).json(resp);
        }
    } catch (error) {
        console.error('Error:', error);
        resp.message = 'Internal Server Error';
        return res.status(500).json(resp);
    }
}

let getSiteAbout = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Fetch Site About',
        errors: [],
        data: {}
    };

    try {
        const about = await usersModel.getSiteAbout();

        if (about) {
            resp.status = true;
            resp.message = 'Site about fetched successfully';
            resp.data = about;
            return res.status(200).json(resp);
        }

        resp.message = 'Site about not found';
        return res.status(404).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }

}


let updateSiteAbout = async (req, res) => {
    const errors = validationResult(req);
    let resp = {
        status: false,
        message: 'Cannot Update Site About',
        errors: [],
        data: {}
    };

    if (!errors.isEmpty()) {
        resp.errors = errors.array();
        return res.status(400).json(resp);
    }

    try {
        const data = req.body;
        const isUpdated = await usersModel.updateSiteAbout(data);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'Site about updated successfully';
            return res.status(200).json(resp);
        }

        resp.message = 'Cannot update site about';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}

let updateUserPolicy = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot Update Policy',
        errors: [],
        data: {}
    };

    try {
        const data = req.body;
        const isUpdated = await usersModel.updateUserPolicy(data);

        if (isUpdated) {
            resp.status = true;
            resp.message = 'Policy updated successfully';
            return res.status(200).json(resp);
        }

        resp.message = 'Cannot update Policy';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }


}


let getUserPolicy = async (req, res) => {

    let resp = {
        status: false,
        message: 'Cannot found Policy',
        errors: [],
        data: {}
    };

    try {
        const policy = await usersModel.getUserPolicy();

        if (policy) {
            resp.status = true;
            resp.message = 'Policy found successfully';
            resp.data = policy
            return res.status(200).json(resp);
        }

        resp.message = 'Cannot found Policy';
        return res.status(200).json(resp);
    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: 'Internal server error' });
        return res.status(500).json(resp);
    }
}


let getDashboardData = async (req, res) => {
    let resp = {
        status: false,
        message: 'Cannot fetch data',
        errors: [],
        data: {}
    };

    try {
        // Fetch all data concurrently using Promise.all
        const [
            userAllTime, userToday,
            vendorAllTime, vendorToday,
            ordersAllTime, ordersToday,
            enquiriesAllTime, enquiriesToday,
            commentsAllTime, commentsToday,
            callsAllTime, callsToday,
            chatAllTime, chatToday
        ] = await Promise.all([
            usersModel.getUsers_byTime('alltime'), usersModel.getUsers_byTime('today'),
            usersModel.getVendor_byTime('alltime'), usersModel.getVendor_byTime('today'),
            usersModel.getOrders_byTime('alltime'), usersModel.getOrders_byTime('today'),
            usersModel.getEnquiries_byTime('alltime'), usersModel.getEnquiries_byTime('today'),
            usersModel.getComments_byTime('alltime'), usersModel.getComments_byTime('today'),
            usersModel.getCalls_byTime('alltime'), usersModel.getCalls_byTime('today'),
            usersModel.getChats_byTime('alltime'), usersModel.getChats_byTime('today')
        ]);

        // Assign fetched data
        resp.data = {
            user: { allTime: userAllTime, today: userToday },
            vendor: { allTime: vendorAllTime, today: vendorToday },
            orders: { allTime: ordersAllTime, today: ordersToday },
            enquiries: { allTime: enquiriesAllTime, today: enquiriesToday },
            comments: { allTime: commentsAllTime, today: commentsToday },
            calls: { allTime: callsAllTime, today: callsToday },
            chat: { allTime: chatAllTime, today: chatToday }
        };

        // Update response status & message
        resp.status = true;
        resp.message = "Dashboard data fetched successfully";

        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        resp.errors.push({ msg: 'Internal server error', details: error.message });
        return res.status(500).json(resp);
    }
};



module.exports = {
    index,
    updateVendorAccess,
    handleAdminLogin,
    handleUserSignUp,
    verifyOtp,
    handleUserLogin,
    getUserById,
    getAllUser,
    getUserStores,
    getUserStoresFollowes,
    updateUser,
    updateUserSocial,
    updateUserSeo,
    getSiteDetails,
    handleUserSignIn,
    addUserName,
    addLeads,
    getLeads,
    getUserPolicy,
    getUserClicks,
    addEnquiry,
    addNewOrder,
    addUserAddess,
    getOrderDetails,
    placeOrder,
    updateUserDetails,
    getUserOrders,
    updateUserPolicy,
    getAllOrder,
    getUserStoresList,
    getQueries,
    getDashboardData,
    getNotification,
    addVendor,
    getVendorStore,
    updateOrderStatus,
    getVendorScoialStatus,
    updateVendorScoialStatus,
    resendOtp,
    getSearchLeads,
    updateVendorStatus,
    deleteNotification,
    getuserStoreLeads,
    deleteVendorNotification,
    addMember,
    deleteMembers,
    getMember,
    getSiteAbout,
    updateSiteAbout,
    deleteUser
}
