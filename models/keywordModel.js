const { executeQuery } = require('../database/db');
const { uid } = require('uid');
const mysql = require('mysql');

// Function to add a new keyword
let addKeyword = async (data,store_id) => {
    return new Promise((resolve, reject) => {
        const {
            keyword,
        } = data;
        let keyword_uid = uid(16);
        const queryString = `INSERT INTO 
                                filter_keywords 
                                    (uid,store_id, keyword, status) 
                                VALUES 
                                    (${mysql.escape(keyword_uid)}, ${mysql.escape(store_id)} , ${mysql.escape(keyword)}, 1)`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(keyword_uid);
        });
    });
};

// Function to get a keyword by its UID
let getKeywordById = async (store_id) => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM filter_keywords WHERE store_id = ${mysql.escape(store_id)}`;
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

// Function to get all keywords
let getAllKeywords = async () => {
    return new Promise((resolve, reject) => {
        const queryString = `SELECT * FROM filter_keywords`;
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

// Function to update a keyword
let updateKeyword = async (uid, data) => {
    return new Promise((resolve, reject) => {
        const updates = [];
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined) {
                updates.push(`${key} = '${value}'`);
            }
        }
        const queryString = `UPDATE filter_keywords SET ${updates.join(', ')} WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Function to delete a keyword
let deleteKeyword = async (uid) => {
    return new Promise((resolve, reject) => {
        const queryString = `DELETE FROM filter_keywords WHERE uid = ${mysql.escape(uid)}`;
        executeQuery(queryString, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

module.exports = {
    addKeyword,
    getKeywordById,
    getAllKeywords,
    updateKeyword,
    deleteKeyword
};
