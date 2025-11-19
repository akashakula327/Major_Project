const db = require('../config/db');
const STATUS = require('../constants/statuses');

// ✅ Get complaints assigned to a specific officer
exports.getAssignedComplaints = (req, res) => {
    const officerId = req.user?.userId || req.user?.id;

    if (!officerId) {
        return res.status(401).json({ message: 'Unauthorized: officer id missing' });
    }

    const query = `
        SELECT c.*, u.name AS citizen_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.assigned_officer_id = ?
    `;
    db.query(query, [officerId], (err, results) => {
        if (err) {
            console.error('Error fetching assigned complaints:', err);
            return res.status(500).json({ message: 'Server Error' });
        }
        res.json(results);
    });
};


// ✅ Update complaint status (IN_PROGRESS, RESOLVED, REJECTED)
exports.updateComplaintStatus = (req, res) => {
    const { complaintId, status } = req.body;

    if (!STATUS.VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const query = 'UPDATE complaints SET status = ? WHERE id = ?';
    db.query(query, [status, complaintId], (err, result) => {
        if (err) {
            console.error('Error updating complaint status:', err);
            return res.status(500).json({ message: 'Server Error' });
        }
        res.json({ message: 'Status updated successfully' });
    });
};
