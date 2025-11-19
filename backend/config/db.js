// config/db.js
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'municipal_complaint_portal',
});

db.connect(err => {
  if (err) {
    console.error('DB Connection Failed:', err);
  } else {
    console.log('✅ Database Connected');
  }
});

module.exports = db;
