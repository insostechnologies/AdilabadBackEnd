const { executeQuery } = require('../database/db');
const { uid } = require('uid');
const mysql = require('mysql');
const { deleteFile } = require('../utils/fileUplode')

// Function to add a new banner
let addBanner = async (data) => {

    return new Promise((resolve, reject) => {
        const { title, type, position, textPosition, isActive } = data;
        let banner_uid = uid(16);
        const queryString = `INSERT INTO 
                                banners 
                                    (uid,title,type,page,position,text_position,status) 
                                VALUES 
                                    (${mysql.escape(banner_uid)}, ${mysql.escape(title)}, ${mysql.escape(type)}, ${mysql.escape(position)},0,${mysql.escape(textPosition)}, ${mysql.escape(isActive)})`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            increaseBannerRanks();
            resolve(banner_uid);
        });
    });
};



let increaseBannerRanks = async () => {

    return new Promise((resolve, reject) => {
        const queryString = `UPDATE banners SET position = position + 1;`;
        executeQuery(queryString, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

let increaseBannerImageRanks = async (banner_id, count) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE banner_images SET position = position + ${count} WHERE banner_id = ${mysql.escape(banner_id)};`;
        executeQuery(queryString, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

let addBannerImages = async (path, banner_id, index, title, linkText, youtubeLink) => {
    return new Promise((resolve, reject) => {
        let banner_image_uid = uid(16);
        const queryString = `INSERT INTO 
                                banner_images 
                                    (uid,banner_id,title,path,position,link,youtube_link,status) 
                                VALUES(
                                    ${mysql.escape(banner_image_uid)},
                                    ${mysql.escape(banner_id)},
                                    ${mysql.escape(title)},
                                    ${mysql.escape(path)},
                                    ${mysql.escape(index)},
                                    ${mysql.escape(linkText)},
                                    ${mysql.escape(youtubeLink)},
                                    1
                                )`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);

            resolve(result);
        });
    });
}

// Function to get a banner by its UID
let getBannerById = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM banners WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, rows) => {
            if (err) return reject(err);
            if (rows.length === 0) {
                return resolve(null);
            } else {
                return resolve(rows[0]);
            }
        });
    });
};

let getBannerImageById = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM banner_images WHERE uid = ${mysql.escape(uid)}`;
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

let getCategoryBannerImagesById = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM categories_banner WHERE uid = ${mysql.escape(uid)}`;
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

let getCategoryBannerImageById = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM categories_banner WHERE uid = ${mysql.escape(uid)}`;
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

let getAllBannersImages = async (banner_id) => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM banner_images WHERE banner_id = ${mysql.escape(banner_id)} ORDER BY position`;
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

// Function to get all banners
let getAllBanners = async (status) => {
    return new Promise((resolve, reject) => {
        let statusCondition = '';
        if (status !== 'all') {
            statusCondition = `WHERE status = ${mysql.escape(status)}`;
        }
        const queryString = `SELECT *, DATE_FORMAT(created_at, '%d %b %Y') AS created_at FROM banners ${statusCondition} ORDER BY position;`;
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

// Function to update a banner
let updateBanner = async (uid, data) => {
    return new Promise((resolve, reject) => {
        const { title, type, position, status } = data;
        const queryString = `UPDATE 
                                banners 
                            SET 
                                title = ${mysql.escape(title)}, 
                                type = ${mysql.escape(type)}, 
                                page = ${mysql.escape(position)}, 
                                status = ${mysql.escape(status)}
                            WHERE 
                                uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

let updateBannerImage = async (uid, data) => {
    return new Promise((resolve, reject) => {
        const { title, link, path, youtube_link } = data;
        const queryString = `UPDATE 
                                banner_images
                            SET 
                                title = ${mysql.escape(title)}, 
                                link = ${mysql.escape(link)}, 
                                path = ${mysql.escape(path)},
                                youtube_link = ${mysql.escape(youtube_link)}
                            WHERE 
                                uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

let updateCategoryBannerImage = async (uid, data) => {
    return new Promise((resolve, reject) => {
        const { category_id, title, url, path, youtubeLink } = data;
        let queryString = `UPDATE 
                                categories_banner
                            SET 
                                category_id = ${mysql.escape(category_id)}, 
                                title = ${mysql.escape(title)}, 
                                url = ${mysql.escape(url)},
                                youtube_link = ${mysql.escape(youtubeLink)}`
        if (path) {
            queryString += `, banner_path = ${mysql.escape(path)}`;
        }
        queryString += `WHERE 
                            uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

// Function to delete a banner
let deleteBanner = async (uid) => {
    let banner = await getBannerById(uid)

    adjustBannerRanksAfterDelete(banner.position)
    return new Promise((resolve, reject) => {
        const queryString = `DELETE FROM banners WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

let adjustBannerImageRanksAfterDelete = async (banner_id, position) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE banner_images SET position = position - 1 WHERE position >= ${position} AND banner_id = ${mysql.escape(banner_id)};`;

        executeQuery(queryString, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

let adjustBannerRanksAfterDelete = async (position) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE banners SET position = position - 1 WHERE position >= ${position};`;

        executeQuery(queryString, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
}

let deleteBannerImage = async (uid) => {
    let banner = await getBannerImageById(uid)
    deleteFile(banner[0].path)
    adjustBannerImageRanksAfterDelete(banner[0].banner_id, banner[0].position)
    return new Promise((resolve, reject) => {
        const queryString = `DELETE FROM banner_images WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

let deleteCategoryBannerImage = async (uid) => {
    let banner = await getCategoryBannerImageById(uid)
    deleteFile(banner[0].path)
    return new Promise((resolve, reject) => {
        const queryString = `DELETE FROM categories_banner WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

let updateBannerStatus = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE banners
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

let updateCategoryBannerStatus = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE categories
                                SET banner_status = CASE
                                                WHEN banner_status = 1 THEN 0
                                                ELSE 1
                                            END
                                WHERE uid = ${mysql.escape(uid)};`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

let updateBannerImageStatus = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE banner_images
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

let updateCategoryBannerImagesStatus = (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `UPDATE categories_banner
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

let addCategoryBanner = async (data, category_id) => {
    return new Promise((resolve, reject) => {
        let category_banner_uid = uid(16);
        const queryString = `INSERT INTO 
                                categories_banner 
                                    (uid,category_id,title,url,banner_path,youtube_link) 
                                VALUES(${mysql.escape(category_banner_uid)},
                                    ${mysql.escape(category_id)},
                                    ${mysql.escape(data.title)},
                                    ${mysql.escape(data.link)},
                                    ${mysql.escape(data.path)},
                                    ${mysql.escape(data.youtubeLink)})`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(category_banner_uid);
        });
    });
}

let getBannersImages = async (uid, status) => {
    return new Promise((resolve, reject) => {
        let statusCondition = '';
        if (status !== 'all') {
            statusCondition = `AND status = ${mysql.escape(status)}`;
        }
        const queryString = `SELECT *, (SELECT COUNT(*) FROM leads AS leads WHERE banner_images.uid = leads.item_id) AS total_leads  FROM banner_images WHERE banner_id = ${mysql.escape(uid)} ${statusCondition} ORDER BY position;`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

let updateBannerRank = async (uid, newRank, page) => {

    return new Promise((resolve, reject) => {
        // First, update the specific row with rank = newRank
        const updateNewRank = `UPDATE banners SET position = ${mysql.escape(newRank)} WHERE uid = ${mysql.escape(uid)};`;
        // Then, update subsequent rows
        const updateSubsequentRows = `UPDATE banners SET position = position + 1 WHERE position >= ${mysql.escape(newRank)} AND page = ${mysql.escape(page)};`;
        const allRanks = `SELECT uid, position FROM banners WHERE page = ${mysql.escape(page)} ORDER BY position;`
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
                            queries.push(`UPDATE banners SET position = ${mysql.escape(newPosition)} WHERE uid = ${mysql.escape(row.uid)};`);
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

let updateBannerImageRank = async (uid, newRank, banner_id) => {

    return new Promise((resolve, reject) => {
        // First, update the specific row with rank = newRank
        const updateNewRank = `UPDATE banner_images SET position = ${mysql.escape(newRank)} WHERE uid = ${mysql.escape(uid)};`;
        // Then, update subsequent rows
        const updateSubsequentRows = `UPDATE banner_images SET position = position + 1 WHERE position >= ${mysql.escape(newRank)} AND banner_id = ${mysql.escape(banner_id)};`;
        const allRanks = `SELECT uid, position FROM banner_images WHERE banner_id = ${mysql.escape(banner_id)} ORDER BY position;`
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
                            queries.push(`UPDATE banner_images SET position = ${mysql.escape(newPosition)} WHERE uid = ${mysql.escape(row.uid)};`);
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

let getCategoryBannerImages = async (category_id, status) => {
    return new Promise((resolve, reject) => {
        let statusCondition = '';
        if (status !== 'all') {
            statusCondition = `AND status = ${mysql.escape(status)}`;
        }
        const queryString = `SELECT *, DATE_FORMAT(created_at, '%d %b %Y') AS created_at FROM categories_banner WHERE category_id = ${mysql.escape(category_id)} ${statusCondition}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
}

module.exports = {
    addBanner,
    addBannerImages,
    getAllBannersImages,
    getCategoryBannerImages,
    getBannerById,
    getAllBanners,
    updateBanner,
    deleteBanner,
    updateBannerStatus,
    getBannersImages,
    updateBannerImageStatus,
    deleteBannerImage,
    getBannerImageById,
    updateBannerImage,
    updateBannerRank,
    updateBannerImageRank,
    increaseBannerImageRanks,
    addCategoryBanner,
    deleteCategoryBannerImage,
    getCategoryBannerImagesById,
    updateCategoryBannerImage,
    updateCategoryBannerStatus,
    updateCategoryBannerImagesStatus
};
