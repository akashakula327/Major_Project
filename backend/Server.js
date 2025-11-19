// server.js (after cleanup)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./config/db');

// Import modular routes
const authRoutes = require('./routes/authRoutes');         // handles login/register/profile
const adminRoutes = require('./routes/adminRoutes');       // admin CRUD + assign complaints
const officerRoutes = require('./routes/officerRoutes');   // officer assigned complaints + status update
const complaintRoutes = require('./routes/complaintRoutes'); // citizen complaint submission & tracking

app.use(express.json());
app.use(cors());

// Base route
app.get('/', (req, res) => {
    res.send('Municipal Complaint Register Backend is Running ✅');
});

// Use modular routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/officer', officerRoutes);
app.use('/complaints', complaintRoutes); // citizen routes

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
