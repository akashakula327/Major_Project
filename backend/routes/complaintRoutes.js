const express = require('express');
const router = express.Router();
const { submitComplaint, getMyComplaints } = require('../controllers/complaintController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.post('/submit', authenticate, authorize(['citizen']), submitComplaint);
router.get('/my', authenticate, authorize(['citizen']), getMyComplaints);

module.exports = router;
