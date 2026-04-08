const db = require('../config/db');
const bcrypt = require('bcrypt');
const ROLES = require('../constants/roles');
const STATUS = require('../constants/statuses');
const SPECIALIZATIONS = require('../constants/specializations');

// ✅ Get available specializations
exports.getSpecializations = (req, res) => {
    res.json(SPECIALIZATIONS.VALID_SPECIALIZATIONS);
};

// ✅ Get all complaints (admin access)
exports.getAllComplaints = (req, res) => {
    const query = `
        SELECT c.*, u.name AS citizen_name, o.name AS officer_name
        FROM complaints c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users o ON c.assigned_officer_id = o.id
        ORDER BY c.created_at DESC
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            return res.status(500).json({ message: 'Server Error' });
        }
        res.json(results);
    });
};

// ✅ Assign complaint to officer
exports.assignComplaint = (req, res) => {
    const { complaintId, officerId } = req.body;
    const query = 'UPDATE complaints SET assigned_officer_id = ? WHERE id = ?';

    db.query(query, [officerId, complaintId], (err, result) => {
        if (err) {
            console.error('Error assigning complaint:', err);
            return res.status(500).json({ message: 'Server Error' });
        }
        res.json({ message: 'Complaint assigned successfully' });
    });
};

// ✅ Get all users (for admin management)
exports.getAllUsers = (req, res) => {
    db.query('SELECT id, name, email FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Server Error' });
        }
        res.json(results);
    });
};

// ✅ Get citizens with their complaint counts
exports.getCitizensWithComplaints = (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            COALESCE(COUNT(c.id), 0) AS complaintCount
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        LEFT JOIN complaints c ON c.user_id = u.id
        WHERE r.name = ?
        GROUP BY u.id, u.name, u.email
        ORDER BY u.name ASC
    `;

    db.query(query, [ROLES.CITIZEN], (err, results) => {
        if (err) {
            console.error('Error fetching citizens:', err);
            console.error('SQL Error Details:', err.sqlMessage || err.message);
            return res.status(500).json({ 
                message: 'Server Error',
                error: err.sqlMessage || err.message 
            });
        }
        
        // Convert complaintCount to number (MySQL returns COUNT as string in some cases)
        const formattedResults = results.map(citizen => ({
            ...citizen,
            complaintCount: parseInt(citizen.complaintCount, 10) || 0
        }));
        
        res.json(formattedResults);
    });
};

// ✅ Create a new officer
exports.createOfficer = async (req, res) => {
    const { name, email, password, specialization } = req.body;

    // Validate input
    if (!name || !email || !password || !specialization) {
        return res.status(400).json({ message: 'Name, email, password, and specialization are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Validate specialization
    if (!SPECIALIZATIONS.VALID_SPECIALIZATIONS.includes(specialization)) {
        return res.status(400).json({ 
            message: 'Invalid specialization. Valid options are: ' + SPECIALIZATIONS.VALID_SPECIALIZATIONS.join(', ')
        });
    }

    try {
        // Check if email already exists
        db.query('SELECT id FROM users WHERE email = ?', [email], async (err, emailResult) => {
            if (err) {
                console.error('Error checking email:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (emailResult.length > 0) {
                return res.status(400).json({ message: 'Email already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Get next user ID using MAX to avoid duplicates (handles deleted users)
            db.query('SELECT COALESCE(MAX(id), 0) AS maxId FROM users', (err, maxResult) => {
                if (err) {
                    console.error('Error getting max user ID:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                const newUserId = (maxResult[0].maxId || 0) + 1;

                // Insert user with specialization
                db.query(
                    'INSERT INTO users (id, name, email, password, specialization) VALUES (?, ?, ?, ?, ?)',
                    [newUserId, name, email, hashedPassword, specialization],
                    (err) => {
                        if (err) {
                            console.error('Error inserting user:', err);
                            return res.status(500).json({ message: 'Failed to create officer' });
                        }

                        // Get officer role ID
                        db.query(
                            'SELECT id FROM roles WHERE name = ?',
                            ["officer"],
                            (err, roleResult) => {
                                if (err || roleResult.length === 0) {
                                    console.error('Error fetching officer role:', err);
                                    return res.status(500).json({ message: 'Officer role not found' });
                                }

                                const roleId = roleResult[0].id;

                                // Assign officer role
                                db.query(
                                    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                                    [newUserId, roleId],
                                    (err) => {
                                        if (err) {
                                            console.error('Error assigning role:', err);
                                            return res.status(500).json({ message: 'Failed to assign officer role' });
                                        }

                                        res.status(201).json({
                                            message: 'Officer created successfully',
                                            officer: {
                                                id: newUserId,
                                                name,
                                                email,
                                                specialization,
                                            }
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    } catch (error) {
        console.error('Error creating officer:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ✅ Get officers with assigned complaint counts
exports.getOfficersWithAssignments = (req, res) => {
    const query = `
        SELECT 
            u.id,
            u.name,
            u.email,
            u.specialization,
            COALESCE(COUNT(c.id), 0) AS assignedComplaints
        FROM users u
        INNER JOIN user_roles ur ON u.id = ur.user_id
        INNER JOIN roles r ON ur.role_id = r.id
        LEFT JOIN complaints c ON c.assigned_officer_id = u.id
        WHERE r.name = ?
        GROUP BY u.id, u.name, u.email, u.specialization
        ORDER BY u.name ASC
    `;

    db.query(query, [ROLES.OFFICER], (err, results) => {
        if (err) {
            console.error('Error fetching officers:', err);
            console.error('SQL Error Details:', err.sqlMessage || err.message);
            return res.status(500).json({ 
                message: 'Server Error',
                error: err.sqlMessage || err.message 
            });
        }
        
        // Convert assignedComplaints to number (MySQL returns COUNT as string in some cases)
        const formattedResults = results.map(officer => ({
            ...officer,
            assignedComplaints: parseInt(officer.assignedComplaints, 10) || 0
        }));
        
        res.json(formattedResults);
    });
};

// ✅ Delete a citizen
exports.deleteCitizen = (req, res) => {
    const { id } = req.params;

    db.beginTransaction((err) => {
        if (err) {
            console.error('Transaction begin failed:', err);
            return res.status(500).json({ message: 'Database transaction failed' });
        }

        db.query(
            `SELECT u.id 
             FROM users u
             INNER JOIN user_roles ur ON u.id = ur.user_id
             INNER JOIN roles r ON ur.role_id = r.id
             WHERE u.id = ? AND r.name = ?`,
            [id, ROLES.CITIZEN],
            (err, result) => {
                if (err) {
                    console.error('Error checking citizen:', err);
                    return db.rollback(() => res.status(500).json({ message: 'Database error' }));
                }

                if (result.length === 0) {
                    return db.rollback(() => res.status(404).json({ message: 'Citizen not found' }));
                }

                const deleteComplaints = 'DELETE FROM complaints WHERE user_id = ?';
                db.query(deleteComplaints, [id], (err) => {
                    if (err) {
                        console.error('Error deleting complaints:', err);
                        return db.rollback(() => res.status(500).json({ message: 'Failed to delete citizen complaints' }));
                    }

                    const deleteRoles = 'DELETE FROM user_roles WHERE user_id = ?';
                    db.query(deleteRoles, [id], (err) => {
                        if (err) {
                            console.error('Error deleting user roles:', err);
                            return db.rollback(() => res.status(500).json({ message: 'Failed to delete citizen roles' }));
                        }

                        const deleteUser = 'DELETE FROM users WHERE id = ?';
                        db.query(deleteUser, [id], (err, deleteResult) => {
                            if (err) {
                                console.error('Error deleting user:', err);
                                return db.rollback(() => res.status(500).json({ message: 'Failed to delete citizen' }));
                            }

                            if (deleteResult.affectedRows === 0) {
                                return db.rollback(() => res.status(404).json({ message: 'Citizen not found' }));
                            }

                            db.commit((err) => {
                                if (err) {
                                    console.error('Transaction commit failed:', err);
                                    return db.rollback(() => res.status(500).json({ message: 'Failed to commit delete operation' }));
                                }

                                res.json({ message: 'Citizen deleted successfully' });
                            });
                        });
                    });
                });
            }
        );
    });
};

// ✅ Delete an officer
exports.deleteOfficer = (req, res) => {
    const { id } = req.params;

    // First, verify the user is an officer
    db.query(
        `SELECT u.id 
         FROM users u
         INNER JOIN user_roles ur ON u.id = ur.user_id
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE u.id = ? AND r.name = ?`,
        [id, ROLES.OFFICER],
        (err, result) => {
            if (err) {
                console.error('Error checking officer:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: 'Officer not found' });
            }

            // Step 1: Unassign all complaints assigned to this officer
            db.query(
                'UPDATE complaints SET assigned_officer_id = NULL WHERE assigned_officer_id = ?',
                [id],
                (err) => {
                    if (err) {
                        console.error('Error unassigning complaints:', err);
                        return res.status(500).json({ message: 'Failed to unassign complaints' });
                    }

                    // Step 2: Delete from user_roles table
                    db.query(
                        'DELETE FROM user_roles WHERE user_id = ?',
                        [id],
                        (err) => {
                            if (err) {
                                console.error('Error deleting user role:', err);
                                return res.status(500).json({ message: 'Failed to delete officer role' });
                            }

                            // Step 3: Delete from users table
                            db.query(
                                'DELETE FROM users WHERE id = ?',
                                [id],
                                (err, deleteResult) => {
                                    if (err) {
                                        console.error('Error deleting user:', err);
                                        return res.status(500).json({ message: 'Failed to delete officer' });
                                    }

                                    if (deleteResult.affectedRows === 0) {
                                        return res.status(404).json({ message: 'Officer not found' });
                                    }

                                    res.json({ message: 'Officer deleted successfully' });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};

// ✅ Delete a complaint
exports.deleteComplaint = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM complaints WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error deleting complaint:', err);
            return res.status(500).json({ message: 'Server Error' });
        }
        res.json({ message: 'Complaint deleted successfully' });
    });
};

// ✅ Update complaint status (Admin)
exports.updateComplaintStatus = (req, res) => {
    const complaintId = req.params.id;
    const { status } = req.body;

    console.log("Complaint ID:", complaintId);
    console.log("Status Received:", status);

    if (!status) {
        return res.status(400).json({ message: "Status is required" });
    }

    // Normalize status value
    const normalizedStatus = status
        .toString()
        .trim()
        .toUpperCase()
        .replace(/-/g, "_"); // "in-progress" → "IN_PROGRESS"

    console.log("Normalized Status:", normalizedStatus);

    if (!STATUS.VALID_STATUSES.includes(normalizedStatus)) {
        return res.status(400).json({
            message: `Invalid status. Allowed: ${validStatuses.join(", ")}`,
            received: normalizedStatus
        });
    }

    const query = `
        UPDATE complaints
        SET status = ?, updated_at = NOW()
        WHERE id = ?
    `;

    db.query(query, [normalizedStatus, complaintId], (err, result) => {
        if (err) {
            console.error("MYSQL ERROR:", err.sqlMessage || err);
            return res.status(500).json({
                message: "Server Error",
                sqlError: err.sqlMessage
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        res.json({ message: "Complaint status updated successfully" });
    });
};