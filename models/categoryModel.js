const { executeQuery } = require('../database/db');
const { uid } = require('uid');
const mysql = require('mysql');
const { deleteFile } = require('../utils/fileUplode')


// Function to add a new category

let addCategory = async (data) => {
    return new Promise((resolve, reject) => {
        const { parent_id, name, icon_type, list_type, icon_img_path, cover_img_path, new_tag, new_tag_text, meta_title, meta_description, status,is_store_only } = data;

        let category_uid = uid(16);
        // Escape values to prevent SQL injection
        const escapedValues = [
            mysql.escape(category_uid),
            mysql.escape(parent_id),
            mysql.escape(name),
            mysql.escape(0),
            mysql.escape(icon_type),
            mysql.escape(list_type),
            mysql.escape(icon_img_path),
            mysql.escape(cover_img_path),
            mysql.escape(new_tag),
            mysql.escape(meta_title),
            mysql.escape(meta_description),
            mysql.escape(new_tag_text),
            mysql.escape(status),
            mysql.escape(is_store_only)
        ];
        const queryString = `INSERT INTO categories (
                                uid,
                                parent_id,
                                name,
                                position,
                                icon_type,
                                list_type,
                                icon_img_path,
                                cover_img_path,
                                new_tag,
                                meta_title,
                                meta_description,
                                new_tag_text,
                                status,
                                is_store_only
                            ) VALUES (${escapedValues.join(', ')});`;

        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            increaseCategoryRanks(parent_id);
            resolve(category_uid);
        });
    });
};

let increaseCategoryRanks = async (parent_id) => {

    return new Promise((resolve, reject) => {
        parent_id = parent_id ? parent_id : '';

        const queryString = `UPDATE categories SET position = position + 1 WHERE parent_id = ${mysql.escape(parent_id)};`;

        executeQuery(queryString, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

const getAllParentCategories = async (status, banner_status) => {
    return new Promise((resolve, reject) => {
        let statusCondition = '';
        if (status !== 'all') {
            statusCondition += `AND c.status = ${mysql.escape(status)}`;
        }
        if (banner_status !== 'all') {
            statusCondition += `AND c.banner_status = ${mysql.escape(banner_status)}`;
        }

        const queryString = `SELECT 
                                c.*,
                                (SELECT COUNT(*) FROM categories AS child WHERE child.parent_id = c.uid) AS sub_categories,
                                (SELECT COUNT(*) FROM store_categories AS stca WHERE stca.category_id = c.uid) AS store_count,
                                (SELECT COUNT(*) FROM categories_banner AS banners WHERE c.uid = banners.category_id) AS banner_count,
                                (SELECT COUNT(*) FROM leads AS leads WHERE c.uid = leads.item_id) AS total_leads,
                                users.user_name AS created_by,
                                DATE_FORMAT(c.created_at, '%d %b %Y') AS created_at,
                                parent.name AS parent_name
                            FROM 
                                categories AS c
                            LEFT JOIN 
                                users ON c.created_by_id = users.uid
                            LEFT JOIN 
                                categories AS parent ON c.parent_id = parent.uid
                            WHERE 
                                c.parent_id = ''
                                ${statusCondition}
                            ORDER BY position;`;
        //console.log(queryString)
        executeQuery(queryString, (err, rows) => {
            if (err) return reject(err);
            resolve(rows.length === 0 ? null : rows);
        });
    });
};

const getAllChildCategories = async (status) => {
    return new Promise((resolve, reject) => {

        let statusCondition = '';
        if (status !== 'all') {
            statusCondition = `AND c.status = ${mysql.escape(status)}`;
        }

        const queryString = `SELECT 
                                c.*,
                                (SELECT COUNT(*) FROM categories AS child WHERE child.parent_id = c.uid) AS sub_categories,
                                (SELECT COUNT(*) FROM store_categories AS stca WHERE stca.category_id = c.uid) AS store_count,
                                (SELECT COUNT(*) FROM leads AS leads WHERE c.uid = leads.item_id) AS total_leads,
                                users.user_name AS created_by,
                                DATE_FORMAT(c.created_at, '%d %b %Y') AS created_at,
                                parent.name AS parent_name
                            FROM 
                                categories AS c
                            LEFT JOIN 
                                users ON c.created_by_id = users.uid
                            LEFT JOIN 
                                categories AS parent ON c.parent_id = parent.uid
                            WHERE 
                                c.parent_id != ''
                                ${statusCondition}
                            ORDER BY position;`;
        executeQuery(queryString, (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                return resolve(null);
            } else {
                return resolve(rows);
            }
        });
    });
}

// Function to get a category by its UID
let getCategoryById = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `
            SELECT 
                c.*,
                (SELECT COUNT(*) FROM categories AS child WHERE child.parent_id = c.uid) AS sub_categories,
                users.user_name AS created_by,
                DATE_FORMAT(c.created_at, '%d %b %Y') AS created_at,
                parent.name AS parent_name
            FROM 
                categories AS c
            LEFT JOIN 
                users ON c.created_by_id = users.uid
            LEFT JOIN 
                categories AS parent ON c.parent_id = parent.uid
            WHERE 
                c.uid = ${mysql.escape(uid)};
        `;
        
        executeQuery(queryString, async (err, rows) => { // Mark this as async
            if (err) return reject(err);
            if (rows.length === 0) {
                return resolve(null);
            } else {
     
                let leadsCat = await getLeadsbyItem(rows[0].uid, 'category'); 
                let leadsSubCat = await getLeadsbyItem(rows[0].uid, 'sub-category'); 
                rows[0].leadsCat = leadsCat ? leadsCat.length : 0
                rows[0].leadsSubCat = leadsSubCat ? leadsSubCat.length : 0
                return resolve(rows[0]);
            }
        });
    });
};

let getLeadsbyItem = async (itemId, type) => {

    let sqlCon = ''
    if (type != null) {
        sqlCon = `AND type = ${mysql.escape(type)}`
    }

    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM leads WHERE item_id = ${mysql.escape(itemId)} ${sqlCon} ORDER BY created_at DESC`;
        executeQuery(queryString, (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                return resolve(null);
            } else {
                return resolve(rows);
            }
        });
    });
}

const updateCategoryRank = async (uid, newRank) => {
    return new Promise((resolve, reject) => {
        // First, update the specific row with rank = newRank
        const updateNewRank = `UPDATE categories SET position = ${mysql.escape(newRank)} WHERE uid = ${mysql.escape(uid)};`;
        // Then, update subsequent rows
        const updateSubsequentRows = `UPDATE categories SET position = position + 1 WHERE position >= ${mysql.escape(newRank)} AND parent_id = '';`;
        const allRanks = `SELECT uid, position FROM categories WHERE parent_id = '' ORDER BY position;`
        // Execute the first update query
        executeQuery(updateSubsequentRows, (err, result) => {
            if (err) {
                return reject(err);
            }
            // Execute the second update query
            executeQuery(updateNewRank, (err, result) => {
                if (err) {
                    return reject(err);
                }
                // Fetch all ranks after updating the positions
                executeQuery(allRanks, (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    // Update positions to ensure no gaps
                    let queries = [];
                    rows.forEach((row, index) => {
                        const newPosition = index + 1; // New position starts from 1
                        if (row.position !== newPosition) {
                            queries.push(`UPDATE categories SET position = ${mysql.escape(newPosition)} WHERE uid = ${mysql.escape(row.uid)};`);
                        }
                    });
                    // Execute all update queries
                    let promiseChain = Promise.resolve();
                    queries.forEach(query => {
                        promiseChain = promiseChain.then(() => {
                            return new Promise((resolve, reject) => {
                                executeQuery(query, (err, result) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(result);
                                });
                            });
                        });
                    });
                    promiseChain
                        .then(() => {
                            resolve(true);
                        })
                        .catch(err => {
                            reject(err);
                        });
                });
            });
        });
    });
};

let updateSubCategoryRank = async (uid, newRank, parent_id) => {
    return new Promise((resolve, reject) => {
        // First, update the specific row with rank = newRank
        const updateNewRank = `UPDATE categories SET position = ${mysql.escape(newRank)} WHERE uid = ${mysql.escape(uid)};`;
        // Then, update subsequent rows
        const updateSubsequentRows = `UPDATE categories SET position = position + 1 WHERE position >= ${mysql.escape(newRank)} AND parent_id = ${mysql.escape(parent_id)};`;
        const allRanks = `SELECT uid, position FROM categories WHERE parent_id = ${mysql.escape(parent_id)} ORDER BY position;`
        // Execute the first update query
        executeQuery(updateSubsequentRows, (err, result) => {
            if (err) {
                return reject(err);
            }
            // Execute the second update query
            executeQuery(updateNewRank, (err, result) => {
                if (err) {
                    return reject(err);
                }
                // Fetch all ranks after updating the positions
                executeQuery(allRanks, (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    // Update positions to ensure no gaps
                    let queries = [];
                    rows.forEach((row, index) => {
                        const newPosition = index + 1; // New position starts from 1
                        if (row.position !== newPosition) {
                            queries.push(`UPDATE categories SET position = ${mysql.escape(newPosition)} WHERE uid = ${mysql.escape(row.uid)};`);
                        }
                    });
                    // Execute all update queries
                    let promiseChain = Promise.resolve();
                    queries.forEach(query => {
                        promiseChain = promiseChain.then(() => {
                            return new Promise((resolve, reject) => {
                                executeQuery(query, (err, result) => {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve(result);
                                });
                            });
                        });
                    });
                    promiseChain
                        .then(() => {
                            resolve(true);
                        })
                        .catch(err => {
                            reject(err);
                        });
                });
            });
        });
    });
}

// Function to get all categories
let getAllCategories = async (banner_status) => {
    let statusCondition = '';
    if (banner_status !== 'all') {
        statusCondition = `WHERE banner_status = ${mysql.escape(banner_status)}`;
    }
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM categories ${statusCondition} ORDER BY position`;
        executeQuery(queryString, (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                return resolve(null);
            } else {
                return resolve(rows);
            }
        });
    });
};

// Function to update a category

let updateCategory = async (uid, data) => {
    let category = await getCategoryById(uid)
    return new Promise((resolve, reject) => {
        const { parent_id, name, icon_img_path, list_type, new_tag, status, new_tag_text, meta_title, meta_description, is_icon_img_changed, is_banner_img_changed, banner_img_path } = data;

        let queryString = `UPDATE categories SET 
                                parent_id = ${mysql.escape(parent_id)}, 
                                name = ${mysql.escape(name)}, 
                                meta_title = ${mysql.escape(meta_title)},
                                meta_description = ${mysql.escape(meta_description)},
                                new_tag_text = ${mysql.escape(new_tag_text)},
                                list_type = ${mysql.escape(list_type)},
                                new_tag = ${mysql.escape(new_tag)},
                                status = ${mysql.escape(status)}`;

        if (is_icon_img_changed) {
            deleteFile(category.icon_img_path)
            queryString += `, icon_img_path = ${mysql.escape(icon_img_path)}`;
        }
        if (is_banner_img_changed) {
            deleteFile(category.cover_img_path)
            queryString += `, cover_img_path = ${mysql.escape(banner_img_path)}`;
        }

        queryString += ` WHERE uid = ${mysql.escape(uid)}`;

        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

let updateCategoryStatus = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE categories
                                SET status = CASE
                                                WHEN status = 1 THEN 0
                                                ELSE 1
                                            END
                                WHERE uid = ${mysql.escape(uid)};`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

let adjustCategoryRanksAfterDelete = async (parent_id, position) => {
    return new Promise((resolve, reject) => {
        parent_id = parent_id ? parent_id : '';

        const queryString = `UPDATE categories SET position = position - 1 WHERE parent_id = ${mysql.escape(parent_id)} AND position >= ${position};`;

        executeQuery(queryString, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

// Function to delete a category
let deleteCategory = async (uid) => {
    let category = await getCategoryById(uid)
    deleteFile(category.icon_img_path)
    deleteFile(category.cover_img_path)
    deleteFile(category.banner_path)
    adjustCategoryRanksAfterDelete(category.parent_id, category.position)
    return new Promise((resolve, reject) => {
        const queryString = `DELETE FROM categories WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            // console.log(category)
            resolve(result);

        });
    });
};

// Function to retrieve sub-categories by parent_id
let getSubCategoriesByParentId = async (parent_id, status) => {
    return new Promise((resolve, reject) => {
        let statusCondition = '';
        if (status !== 'all') {
            statusCondition = `AND c.status = ${mysql.escape(status)}`;
        }

        const queryString = `SELECT 
                                c.*,
                                (SELECT COUNT(*) 
                                 FROM categories AS child 
                                 WHERE child.parent_id = c.uid) AS sub_categories,
                                (SELECT COUNT(*) 
                                 FROM store_categories AS stca 
                                 LEFT JOIN stores ON stca.store_id = stores.uid 
                                 WHERE stca.category_id = c.uid AND stores.status = 1) AS store_count,
                                (SELECT COUNT(*) 
                                 FROM leads AS leads 
                                 WHERE c.uid = leads.item_id) AS total_leads,
                                users.user_name AS created_by,
                                DATE_FORMAT(c.created_at, '%d %b %Y') AS created_at,
                                parent.name AS parent_name
                            FROM 
                                categories AS c
                            LEFT JOIN 
                                users ON c.created_by_id = users.uid
                            LEFT JOIN 
                                categories AS parent ON c.parent_id = parent.uid
                            WHERE 
                                c.parent_id = ${mysql.escape(parent_id)}
                                ${statusCondition}
                            ORDER BY position;`;

        executeQuery(queryString, (err, rows) => {
            if (err) return reject(err);
            resolve(rows.length === 0 ? null : rows);
        });
    });
};



module.exports = {
    addCategory,
    getCategoryById,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getSubCategoriesByParentId,
    getAllParentCategories,
    getAllChildCategories,
    updateCategoryStatus,
    updateCategoryRank,
    updateSubCategoryRank,
    increaseCategoryRanks,
    adjustCategoryRanksAfterDelete
};
