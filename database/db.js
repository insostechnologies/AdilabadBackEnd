const mysql = require('mysql');
const fs = require('fs');
const config = require('../config/config');
const { getCurrentDateTime } = require('../utils/helpers');

// Create a connection pool with robust cloud timeouts and connection caps
const pool = mysql.createPool({
    connectionLimit: 15,
    queueLimit: 0,
    acquireTimeout: 10000,
    connectTimeout: 10000,
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
});

// Variable to store the last backup timestamp
let lastBackupTime = 0; // Initialize as 0 so the backup can run initially
const backupInterval = 24 * 60 * 60 * 1000; // Backup every 24 hours

// Function to get a list of tables in the database
const getTables = (callback) => {
    pool.query('SHOW TABLES', (err, results) => {
        if (err) {
            callback(err, null);
            return;
        }
        const tables = results.map(row => Object.values(row)[0]);
        callback(null, tables);
    });
}

// Function to generate SQL dump for a table
const getTableDump = (tableName, callback) => {
    const schemaQuery = `SHOW CREATE TABLE ${tableName}`;
    const dataQuery = `SELECT * FROM ${tableName}`;

    pool.query(schemaQuery, (err, results) => {
        if (err) {
            callback(err, null);
            return;
        }

        const createTableStatement = results[0]['Create Table'] + ';';

        pool.query(dataQuery, (err, rows) => {
            if (err) {
                callback(err, null);
                return;
            }

            const dataInsertStatements = rows.map(row => {
                const values = Object.values(row).map(value => mysql.escape(value)).join(', ');
                return `INSERT INTO ${tableName} VALUES (${values});`;
            }).join('\n');

            callback(null, createTableStatement + '\n' + dataInsertStatements);
        });
    });
}

// Function to backup the entire database to an SQL file
const backupDatabase = () => {
    const currentTimestamp = Date.now();

    // Only backup if enough time has passed since the last backup
    if (currentTimestamp - lastBackupTime < backupInterval) {
        // const timeSinceLastBackup = ((currentTimestamp - lastBackupTime) / 1000).toFixed(2);
        // console.log(`Skipping backup, last backup was recent. Time since last backup: ${timeSinceLastBackup} seconds`);
        return;
    }

    const backupDir = './backups';
    const backupFileName = `${backupDir}/database_backup.sql`;

    // Check if the 'backups' directory exists, create it if not
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        console.log(`Created backup directory: ${backupDir}`);
    }

    getTables((err, tables) => {
        if (err) {
            console.error('Error getting tables:', err);
            return;
        }

        let backupContent = '';

        let remainingTables = tables.length;
        if (remainingTables === 0) {
            fs.writeFileSync(backupFileName, backupContent);
            console.log(`Database backup created at: ${backupFileName}`);
            lastBackupTime = currentTimestamp; // Update last backup time
            return;
        }

        tables.forEach(table => {
            getTableDump(table, (err, tableDump) => {
                if (err) {
                    console.error(`Error getting dump for table ${table}:`, err);
                } else {
                    backupContent += `\n-- Dumping table ${table}\n${tableDump}\n`;
                }

                remainingTables--;
                if (remainingTables === 0) {
                    fs.writeFileSync(backupFileName, backupContent);
                    console.log(`Database backup created at: ${backupFileName}`);
                    lastBackupTime = currentTimestamp; // Update last backup time
                }
            });
        });
    });
}

// Function to execute a query using the connection pool
const executeQuery = (queryString, callback) => {
    // Backup the database only if needed
    // backupDatabase();

    // Get a connection from the pool
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting connection from pool:===>', err);
            callback(err, null);
            return;
        }

        // Perform the database query
        connection.query(queryString, (err, rows) => {
            // Release the connection back to the pool, regardless of error or success
            connection.release();
            // console.log(`Query executed: ${queryString}`);
            if (err) {
                console.error('Error executing query:===>', err);
                callback(err, null);
                return;
            }

            // Pass the query results to the callback function
            callback(null, rows);
        });
    });
}

module.exports = {
    executeQuery
};
