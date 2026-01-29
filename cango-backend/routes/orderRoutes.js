const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ PLACE ORDER (must be FIRST)
router.post('/place', async (req, res) => {
  const { userEmail, title } = req.body;

  if (!userEmail || !title) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    await db.query(
      'INSERT INTO orders (user_email, title) VALUES (?, ?)',
      [userEmail, title]
    );
    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    console.error("❌ Order insert error:", err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// ✅ GET USER ORDERS (must be AFTER static routes)
router.get('/:email', async (req, res) => {
  const userEmail = req.params.email;

  try {
    const [orders] = await db.query(
      "SELECT title, created_at AS date FROM orders WHERE user_email = ? ORDER BY created_at DESC",
      [userEmail]
    );
    res.json(orders);
  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    res.status(500).json({ error: "Failed to fetch order history" });
  }
});

module.exports = router;
