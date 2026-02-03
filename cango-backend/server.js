const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const db = require('./config/db');
const adminRoutes = require('./routes/adminRoutes');
const locationRoutes = require('./routes/locationRoutes');
const orderRoutes = require('./routes/orderRoutes'); // ✅ Add this near the top
const uploadRoutes = require("./routes/uploadRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Serve static files BEFORE other routes
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/api/upload", uploadRoutes);

// ✅ API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes); // ✅ Add this in API routes section
app.use('/api/location', locationRoutes); // ✅ Fixed position (moved out of inner route)
app.use("/api/subscription", subscriptionRoutes);

// ✅ Default route should go LAST or REMOVE this entirely
// If you keep it, do NOT let it override static
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/learn', (req, res) => {
  res.sendFile(__dirname + '/public/learn.html');
});

// ✅ API: Get visible contents
app.get('/api/contents', async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM contents WHERE visible = 1 ORDER BY created_at DESC");
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch contents" });
  }
});

// ✅ API: Get content by ID
app.get('/api/contents/:id', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM contents WHERE id = ?", [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Content not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ API: Admin fetch all content
app.get('/api/admin/contents', async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM contents ORDER BY created_at DESC");
    res.json(results);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch all contents" });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`📂 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Get WhatsApp number by email
app.get('/api/users/:email', (req, res) => {
  const email = req.params.email;
  const sql = 'SELECT name, email, whatsapp FROM users WHERE email = ?';

  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error('Error fetching user info:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result[0]);
  });
});

 app.get('/api/admin/orders', async (req, res) => {
  const searchEmail = req.query.email;

  let sql = `
    SELECT 
      o.id,
      u.name,
      u.email,
      u.whatsapp,
      o.title AS content_ordered,
      o.created_at AS order_date_time
    FROM orders o
    JOIN users u ON o.user_email = u.email
  `;

  const params = [];

  if (searchEmail) {
    sql += ` WHERE u.email LIKE ?`;
    params.push(`%${searchEmail}%`);
  }

  sql += ` ORDER BY o.created_at DESC`;

  try {
    const [results] = await db.query(sql, params);
    return res.json(results);
  } catch (err) {
    console.error("❌ /api/admin/orders error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});
