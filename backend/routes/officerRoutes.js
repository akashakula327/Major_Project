const express = require('express');
const router = express.Router();
const officerController = require('../controllers/officerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Protect all officer routes
router.use(authenticate, authorize(['officer']));

router.get('/complaints', officerController.getAssignedComplaints);
router.post('/update-status', officerController.updateComplaintStatus);

module.exports = router;
