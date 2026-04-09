const db = require('../config/db');
const axios = require('axios');
require('dotenv').config();

// ✅ Configuration
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Fast & intelligent open model via Groq
const MAX_RETRIES = 3;

// ✅ Simple in-memory queue to prevent concurrent API burst
let activeAITasks = 0;
const MAX_CONCURRENT_AI = 3;
const aiQueue = [];

// Helper: DB query as Promise
const dbQuery = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// ✅ Queue runner — processes one task at a time up to MAX_CONCURRENT_AI
function enqueueAITask(complaintId, text) {
  return new Promise((resolve, reject) => {
    aiQueue.push({ complaintId, text, resolve, reject });
    runNextAITask();
  });
}

function runNextAITask() {
  if (activeAITasks >= MAX_CONCURRENT_AI || aiQueue.length === 0) return;

  const { complaintId, text, resolve, reject } = aiQueue.shift();
  activeAITasks++;

  processAIAnalysis(complaintId, text)
    .then(resolve)
    .catch(reject)
    .finally(() => {
      activeAITasks--;
      runNextAITask(); // process next in queue
    });
}

// ✅ Groq API call with retry + exponential backoff
async function callGroqWithRetry(text) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // ✅ Log API key presence (never log the actual key)
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not defined in environment variables');
      }

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Classify municipal complaints. The category MUST be exactly one of: "Sanitation", "Water", "Roads", "Electricity", "Drainage", "Animal Control", "Public Safety", "Other". Do NOT use any other category. Return ONLY valid JSON with no markdown, no backticks: {"category": string, "priority": "Low"|"Medium"|"High", "summary": string}'
            },
            {
              role: 'user',
              content: `Complaint: "${text}"`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1, // ✅ Low temperature = more deterministic/consistent output
          max_tokens: 200, // ✅ Limit output to save quota
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
        }
      );

      const rawText = response.data?.choices?.[0]?.message?.content;

      if (!rawText) {
        throw new Error('Empty response from Groq API');
      }

      // ✅ Strip markdown fences if model wraps JSON in ```json ... ```
      const cleaned = rawText.replace(/```json|```/gi, '').trim();
      const parsed = JSON.parse(cleaned);

      // ✅ Validate returned fields
      const validCategories = ['Sanitation', 'Water', 'Roads', 'Electricity', 'Drainage', 'Animal Control', 'Public Safety', 'Other'];
      const validPriorities = ['Low', 'Medium', 'High'];

      if (!validCategories.includes(parsed.category)) parsed.category = 'Other';
      if (!validPriorities.includes(parsed.priority)) parsed.priority = 'Medium';
      if (!parsed.summary || typeof parsed.summary !== 'string') parsed.summary = text.slice(0, 100);

      return parsed;

    } catch (err) {
      const status = err.response?.status;
      const isRateLimit = status === 429;
      const isServerError = status >= 500;

      if ((isRateLimit || isServerError) && attempt < MAX_RETRIES) {
        const waitMs = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.warn(`⏳ Groq API issue (status ${status}, attempt ${attempt}/${MAX_RETRIES}). Retrying in ${waitMs}ms...`);
        await new Promise((res) => setTimeout(res, waitMs));
      } else {
        // ✅ Log full error details for debugging
        console.error('❌ Groq API error:', {
          status,
          message: err.response?.data?.error?.message || err.message,
          attempt,
        });
        throw err;
      }
    }
  }
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

    // 3. ✅ Enqueue background AI analysis (rate-limited, not fire-and-forget)
    enqueueAITask(complaintId, complaint).catch((err) =>
      console.error(`[Background Task Error] ID ${complaintId}:`, err.message)
    );

  } catch (error) {
    console.error('❌ Submit complaint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// ✅ Background AI analysis with retry
async function processAIAnalysis(complaintId, text) {
  let aiData;

  try {
    aiData = await callGroqWithRetry(text);
    console.log(`✅ AI categorized complaint ${complaintId}:`, aiData);
  } catch (err) {
    console.error(`❌ Groq API failed for complaint ${complaintId}. Categorization aborted. Error:`, err.response?.data?.error?.message || err.message);
    return;
  }

  // Update complaint with categorization (AI only)
  await dbQuery(
    `UPDATE complaints SET category = ?, priority = ?, summary = ?, updated_at = NOW() WHERE id = ?`,
    [aiData.category || 'Other', aiData.priority || 'Medium', aiData.summary || '', complaintId]
  );

  // Auto-assign to officer with matching specialization and least active complaints
  if (aiData.category) {
    const officerQuery = `
      SELECT u.id FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      LEFT JOIN complaints c ON c.assigned_officer_id = u.id AND c.status NOT IN ('resolved', 'closed')
      WHERE r.name = 'officer' AND u.specialization = ?
      GROUP BY u.id
      ORDER BY COUNT(c.id) ASC
      LIMIT 1
    `;

    const officers = await dbQuery(officerQuery, [aiData.category]);

    if (officers.length > 0) {
      await dbQuery('UPDATE complaints SET assigned_officer_id = ? WHERE id = ?', [officers[0].id, complaintId]);
      console.log(`✅ Complaint ${complaintId} assigned to officer ${officers[0].id}`);
    } else {
      console.warn(`⚠️ No officer found for category: ${aiData.category}`);
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