require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool(
  process.env.DATABASE_URL
    ? process.env.DATABASE_URL
    : {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT || "3306"),
        waitForConnections: true,
        connectionLimit: 10,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
      }
);

console.log("MySQL connection pool created");

module.exports = pool;