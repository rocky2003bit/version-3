const express = require("express");
const router = express.Router();
const db = require("../config/db");
const auth = require("../middlewares/auth");
const crypto = require("crypto");


// ✅ Get all active plans
router.get("/plans", async (req, res) => {
  try {
    const [plans] = await db.query(
      "SELECT id, name, price_inr, duration_days FROM plans WHERE is_active = 1 ORDER BY price_inr ASC"
    );
    return res.json(plans);
  } catch (err) {
    console.error("Plans error:", err);
    return res.status(500).json({ error: "Failed to load plans" });
  }
});

// ✅ Check current user's subscription
router.get("/me", auth, async (req, res) => {
  const email = req.user.email;

  try {
    const [rows] = await db.query(
      `SELECT s.status, s.start_at, s.end_at, p.name AS plan_name, p.price_inr
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_email = ?
       ORDER BY s.id DESC
       LIMIT 1`,
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.json({ subscribed: false });
    }

    const sub = rows[0];
    const active =
      sub.status === "active" &&
      sub.end_at &&
      new Date(sub.end_at) > new Date();

    return res.json({
      subscribed: active,
      status: sub.status,
      plan: sub.plan_name,
      start_at: sub.start_at,
      end_at: sub.end_at,
    });
  } catch (err) {
    console.error("Subscription me error:", err);
    return res.status(500).json({ error: "Failed to check subscription" });
  }
});

module.exports = router;
