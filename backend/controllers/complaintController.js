const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

// ✅ Configuration
const GEMINI_MODEL = 'gemini-2.0-flash-lite'; // Uses separate quota pool from gemini-2.0-flash
const MAX_RETRIES = 3;

// Helper: DB query as Promise
const dbQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// ✅ Gemini API call with retry + exponential backoff
async function callGeminiWithRetry(text) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: `Complaint: "${text}"` }] }],
          system_instruction: {
            parts: [{ text: 'Classify municipal complaints. The category MUST be exactly one of: "Sanitation", "Water", "Roads", "Electricity", "Drainage", "Animal Control", "Public Safety", "Other". Do NOT use any other category. Return ONLY JSON: {"category": string, "priority": "Low"|"Medium"|"High", "summary": string}' }]
          },
          generationConfig: {
            response_mime_type: 'application/json'
          }
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );
      return JSON.parse(response.data.candidates[0].content.parts[0].text);
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 && attempt < MAX_RETRIES) {
        const waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.warn(`⏳ Rate limited (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      } else {
        throw err;
      }
    }
  }
}

// ✅ Fallback keyword-based categorizer (when Gemini API is unavailable)
function fallbackCategorize(complaintText) {
  const text = complaintText.toLowerCase();

  const categoryMap = [
    { keywords: ['garbage', 'waste', 'trash', 'dustbin', 'dump', 'clean', 'sanitation', 'sweeping', 'litter', 'hygiene', 'toilet', 'restroom'], category: 'Sanitation', priority: 'Medium' },
    { keywords: ['water', 'pipe', 'leak', 'tap', 'supply', 'bore', 'well', 'tanker', 'drinking'], category: 'Water', priority: 'High' },
    { keywords: ['road', 'pothole', 'crack', 'pavement', 'footpath', 'bridge', 'highway', 'street', 'traffic', 'signal', 'parking'], category: 'Roads', priority: 'High' },
    { keywords: ['electricity', 'power', 'light', 'lamp', 'pole', 'wire', 'transformer', 'outage', 'current', 'voltage'], category: 'Electricity', priority: 'High' },
    { keywords: ['drain', 'drainage', 'sewage', 'sewer', 'flood', 'clog', 'blocked', 'overflow', 'gutter', 'manhole'], category: 'Drainage', priority: 'High' },
    { keywords: ['dog', 'cat', 'animal', 'stray', 'snake', 'monkey', 'cattle', 'cow', 'pig', 'rat', 'mosquito', 'insect', 'pest'], category: 'Animal Control', priority: 'Medium' },
    { keywords: ['safety', 'crime', 'theft', 'robbery', 'fight', 'assault', 'police', 'danger', 'hazard', 'fire', 'accident', 'emergency'], category: 'Public Safety', priority: 'High' },
  ];

  for (const entry of categoryMap) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return {
        category: entry.category,
        priority: entry.priority,
        summary: complaintText.length > 100 ? complaintText.slice(0, 97) + '...' : complaintText,
      };
    }
  }

  return {
    category: 'Other',
    priority: 'Medium',
    summary: complaintText.length > 100 ? complaintText.slice(0, 97) + '...' : complaintText,
  };
}

// ✅ Submit Complaint
exports.submitComplaint = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: user not found in token' });
    }

    const { complaint, location } = req.body;
    if (!complaint || !location) {
      return res.status(400).json({ message: 'Complaint text and location are required' });
    }

    const title = complaint.length > 60 ? `${complaint.slice(0, 57)}...` : complaint;

    // 1. Save initial complaint to DB immediately
    const insertQuery = `
      INSERT INTO complaints (user_id, title, description, location, status, category, priority, summary, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', 'Other', 'Low', '', NOW(), NOW())
    `;

    const result = await dbQuery(insertQuery, [userId, title, complaint, location]);
    const complaintId = result.insertId;

    // 2. Send success response immediately
    res.status(201).json({
      message: 'Complaint submitted and is being processed.',
      complaintId,
    });

    // 3. Background AI analysis (with retry + fallback)
    processAIAnalysis(complaintId, complaint).catch(err =>
      console.error(`[Background Task Error] ID ${complaintId}:`, err.message)
    );

  } catch (error) {
    console.error('❌ Submit complaint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// ✅ Background AI analysis with retry + fallback
async function processAIAnalysis(complaintId, text) {
  let aiData;

  try {
    aiData = await callGeminiWithRetry(text);
    console.log(`✅ AI categorized complaint ${complaintId}:`, aiData);
  } catch (err) {
    console.warn(`⚠️ Gemini API failed for complaint ${complaintId}:`, err.response?.data?.error?.message || err.message);
    console.log(`🔄 Using fallback keyword categorizer for complaint ${complaintId}`);
    aiData = fallbackCategorize(text);
  }

  // Update complaint with categorization (AI or fallback)
  await dbQuery(
    `UPDATE complaints SET category = ?, priority = ?, summary = ?, updated_at = NOW() WHERE id = ?`,
    [aiData.category || 'Other', aiData.priority || 'Low', aiData.summary || '', complaintId]
  );

  // Auto-assign to officer with matching specialization and least complaints
  if (aiData.category) {
    const officerQuery = `
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN complaints c ON c.assigned_officer_id = u.id
      WHERE r.name = 'officer' AND u.specialization = ?
      GROUP BY u.id
      ORDER BY COUNT(c.id) ASC
      LIMIT 1
    `;

    const officers = await dbQuery(officerQuery, [aiData.category]);

    if (officers.length > 0) {
      await dbQuery('UPDATE complaints SET assigned_officer_id = ? WHERE id = ?', [officers[0].id, complaintId]);
      console.log(`✅ Complaint ${complaintId} assigned to officer ${officers[0].id}`);
    }
  }
}

// ✅ Get Complaints for Logged-in Citizen
exports.getMyComplaints = (req, res) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const query = 'SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC';
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching complaints' });
    res.json(results);
  });
};
