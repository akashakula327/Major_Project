const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ROLES = require('../constants/roles');
require('dotenv').config();

exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    // STEP 1: Check if email already exists
    db.query(
      'SELECT id FROM users WHERE email = ?',
      [email],
      (err, emailResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (emailResult.length > 0) {
          return res.status(400).json({ message: 'Email already exists' });
        }

        // STEP 2: Generate ID safely using MAX(id)
        db.query('SELECT MAX(id) AS maxId FROM users', (err, idResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'User ID fetch failed' });
          }

          const newUserId = (idResult[0].maxId || 0) + 1;

          // STEP 3: Insert user with manual ID
          db.query(
            'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
            [newUserId, name, email, hashed],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: 'User insert failed' });
              }

              // STEP 4: Get default citizen role
              db.query(
                'SELECT id FROM roles WHERE name = ?',
                [ROLES.CITIZEN],
                (err, roleResult) => {
                  if (err || roleResult.length === 0) {
                    return res.status(500).json({ message: 'Citizen role missing' });
                  }

                  const roleId = roleResult[0].id;

                  // STEP 5: Assign role
                  db.query(
                    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
                    [newUserId, roleId],
                    err => {
                      if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Role assignment failed' });
                      }

                      return res.status(201).json({
                        success: true,
                        message: 'User registered successfully',
                        userId: newUserId
                      });
                    }
                  );
                }
              );
            }
          );
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = results[0];

    // Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Fetch user role
    db.query(
      `SELECT r.name AS role 
       FROM user_roles ur 
       JOIN roles r ON ur.role_id = r.id 
       WHERE ur.user_id = ?`,
      [user.id],
      (err, roleRes) => {
        if (err) {
          console.error("Role Fetch Error:", err);
          return res.status(500).json({ success: false, message: 'Role fetch failed' });
        }

        const role = roleRes[0]?.role || ROLES.CITIZEN;

        // Create JWT
        const token = jwt.sign(
          { userId: user.id, role },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES }
        );

        // Final Response
        res.json({
          success: true,
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role
          }
        });
      }
    );
  });
};
