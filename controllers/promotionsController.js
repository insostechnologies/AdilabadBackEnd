const db = require('../database/db')
const promotionsModel = require('../models/promotionsModel')
const userModel = require('../models/userModel')
const { saveBase64File } = require('../utils/fileUplode')
const storeModel = require('../models/storeModel')

const addPromotionNotification = async (req, res) => {
    const resp = {
        status: false,
        message: 'Cannot Add Notification',
        errors: [],
        data: {}
    };

    try {
        const data = req.body;

        // Determine user list based on notification type
        let users = [];
        if (data.type === 'customers') {
            users = await userModel.getAllUser('user', 'active');
        } else if (data.type === 'all_user') {
            users = await userModel.getAllUser('any', 'active');
        } else if (data.type === 'vendors') {
            users = await userModel.getAllUser('vendor', 'active');
        }

        if (!users || users.length === 0) {
            resp.errors.push({ msg: 'No users found for the specified type.' });
            return res.status(404).json(resp);
        }

        // Save the base64 image to a file
        const base64Data = data.images.replace(/^data:image\/\w+;base64,/, '');
        const filePath = 'uploads/notification_images/';
        const path = await saveBase64File(base64Data, filePath);
        data.path = path;

        // Notify each user
        let successCount = 0;
        for (const user of users) {
            try {
                const isUploaded = await promotionsModel.addNotification(data, user);
                if (isUploaded) successCount++;
            } catch (err) {
                console.error(`Failed to add notification for user ${user.id}:`, err.message);
            }
        }

        // Handle success/failure
        if (successCount > 0) {
            resp.status = true;
            resp.message = `${successCount} notifications added successfully.`;
            return res.status(200).json(resp);
        } else {
            resp.message = 'Failed to add notifications for all users.';
            return res.status(500).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }
};


let addPromotionNotificationVendor = async (req, res) => {
    const resp = {
        status: false,
        message: 'Cannot Add Notification',
        errors: [],
        data: {}
    };

    try {
        const data = req.body;

        let users = await storeModel.getStoreFollowers(data.storeId);

        // return res.status(200).json(users);



        if (!users || users.length === 0) {
            resp.message = 'Store Has No Followers' ;
            return res.status(200).json(resp);
        }

        // Save the base64 image to a file
        const base64Data = data.images.replace(/^data:image\/\w+;base64,/, '');
        const filePath = 'uploads/notification_images/';
        const path = await saveBase64File(base64Data, filePath);
        data.path = path;

        // Notify each user
        let successCount = 0;
        for (const user of users) {
            try {
                const isUploaded = await promotionsModel.addNotificationVendor(data, user.user_id);
                if (isUploaded) successCount++;
            } catch (err) {
                console.error(`Failed to add notification for user ${user.id}:`, err.message);
            }
        }

        // Handle success/failure
        if (successCount > 0) {
            resp.status = true;
            resp.message = `${successCount} notifications added successfully.`;
            return res.status(200).json(resp);
        } else {
            resp.message = 'Failed to add notifications for all users.';
            return res.status(500).json(resp);
        }

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }

}


let getVendorNotifications = async (req, res) => {

    const resp = {
        status: false,
        message: 'Cannot Get Notifications',
        errors: [],
        data: {}
    };

    try {
        const storeId = req.query.store_id;
        const notifications = await promotionsModel.getVendorNotifications(storeId);

        if (!notifications || notifications.length === 0) {
            resp.errors.push({ msg: 'No notifications found for the specified store.' });
            return res.status(404).json(resp);
        }

        resp.status = true;
        resp.message = 'Notifications retrieved successfully.';
        resp.data = notifications;
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }

}


let getNotifications = async (req, res) => {

    const resp = {
        status: false,
        message: 'Cannot Get Notifications',
        errors: [],
        data: {}
    };

    try {
        const notifications = await promotionsModel.getNotifications();

        if (notifications.length === 0) {
            resp.errors.push({ msg: 'No notifications found.' });
            return res.status(404).json(resp);
        }

        resp.status = true;
        resp.message = 'Notifications retrieved successfully.';
        resp.data = notifications;
        return res.status(200).json(resp);

    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }

}

let deleteNotifications = async (req,res) =>{
    const resp = {
        status: false,
        message: 'Cannot Get Notifications',
        errors: [],
        data: {}
    };

    try {
        const title = req.query.t;

        const isDeleted = await promotionsModel.deleteNotifications(title);

        if (isDeleted) {
            resp.status = true;
            resp.message = 'Notifications Deleted successfully.';
            return res.status(200).json(resp);
        }else{
            resp.message  = 'No notifications Deleted.';
            return res.status(404).json(resp);
        }


    } catch (error) {
        console.error('Error:', error);
        resp.errors.push({ msg: error.message || 'Internal server error' });
        return res.status(500).json(resp);
    }

}

module.exports = {
    addPromotionNotification,
    addPromotionNotificationVendor,
    getVendorNotifications,
    getNotifications,
    deleteNotifications
};