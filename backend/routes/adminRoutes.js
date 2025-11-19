const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Protect all routes for admin only
router.use(authenticate, authorize(['admin']));

router.get('/complaints', adminController.getAllComplaints);
router.post('/assign', adminController.assignComplaint);
router.get('/users', adminController.getAllUsers);
router.get('/officers', adminController.getOfficersWithAssignments);
router.post('/officers', adminController.createOfficer);
router.delete('/officers/:id', adminController.deleteOfficer);
router.get('/citizens', adminController.getCitizensWithComplaints);
router.delete('/citizens/:id', adminController.deleteCitizen);
router.delete('/complaints/:id', adminController.deleteComplaint);
router.put('/complaints/:id/status', adminController.updateComplaintStatus);


module.exports = router;
