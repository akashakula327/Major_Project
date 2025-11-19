// controllers/complaintController.js
const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

exports.submitComplaint = async (req, res) => {
  try {
    // ✅ Extract userId from decoded JWT
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found in token' });
    }

    const { title, description, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // ✅ Insert complaint into DB
    const insertQuery = `
      INSERT INTO complaints (user_id, title, description, location, status, category, priority, summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', 'General', 'Low', '', NOW(), NOW())
    `;
    db.query(insertQuery, [userId, title, description, location || null], async (err, result) => {
      if (err) {
        console.error('❌ Error inserting complaint:', err);
        return res.status(500).json({ message: 'Error submitting complaint' });
      }

      const complaintId = result.insertId;

      // ✅ Optional Gemini AI Analysis
      try {
        const prompt = `
          You are an assistant classifying municipal complaints.
          Return ONLY JSON (no markdown). Example:
          {"category":"Water","priority":"High","summary":"Pipe leakage near main road"}

          Complaint: "${title}. ${description}"
        `;

        const aiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
          }
        );

        // ✅ Extract AI response safely
        let aiText = aiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        aiText = aiText.replace(/```(json)?|```/g, '').trim();

        // Keep only JSON braces
        const firstCurly = aiText.indexOf('{');
        const lastCurly = aiText.lastIndexOf('}');
        if (firstCurly !== -1 && lastCurly !== -1) {
          aiText = aiText.substring(firstCurly, lastCurly + 1);
        }

        let aiData = { category: 'General', priority: 'Medium', summary: '' };
        try {
          aiData = JSON.parse(aiText);
        } catch (parseError) {
          console.warn('⚠️ Failed to parse AI response:', aiText);
        }

        // ✅ Update complaint with AI categorization
        const updateQuery = `
          UPDATE complaints
          SET category = ?, priority = ?, summary = ?, updated_at = NOW()
          WHERE id = ?
        `;
        db.query(updateQuery, [aiData.category, aiData.priority, aiData.summary, complaintId], (err2) => {
          if (err2) console.error('❌ Error saving AI data:', err2);
        });
      } catch (aiError) {
        console.error('⚠️ AI processing error:', aiError.response?.data || aiError.message);
      }

      // ✅ Success response
      res.status(201).json({
        message: 'Complaint submitted successfully',
        complaintId,
      });
    });
  } catch (error) {
    console.error('❌ Submit complaint error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ Get Complaints for Logged-in Citizen
exports.getMyComplaints = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: user not found in token' });
  }

  const query = 'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC';
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error fetching complaints:', err);
      return res.status(500).json({ message: 'Error fetching complaints' });
    }
    res.json(results);
  });
};

