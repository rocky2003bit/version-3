const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '../.env')
}); // ensures environment variables are available


const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cango',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully!');
    connection.release(); // release the connection back to pool
  }
});

module.exports = pool.promise(); // to use async/await
