const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require("../middlewares/auth");
const requireSubscription = require("../middlewares/requireSubscription");


// ✅ PLACE ORDER (secure)
router.post('/place', auth, requireSubscription, async (req, res) => {
  const { title } = req.body;
  const userEmail = req.user.email; // ✅ get from token, NOT from body

  if (!title) {
    return res.status(400).json({ error: 'Missing title' });
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

// ✅ GET USER ORDERS
router.get("/my", auth, async (req, res) => {
  const userEmail = req.user.email;

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
