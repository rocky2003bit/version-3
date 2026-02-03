const db = require("../config/db");

module.exports = async function requireSubscription(req, res, next) {
  const email = req.user.email;

  try {
    const [rows] = await db.query(
      `SELECT status, end_at
       FROM subscriptions
       WHERE user_email = ?
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );

    if (!rows || rows.length === 0) {
      return res.status(403).json({ error: "Subscription required" });
    }

    const sub = rows[0];
    const active =
      sub.status === "active" &&
      sub.end_at &&
      new Date(sub.end_at) > new Date();

    if (!active) {
      return res.status(403).json({ error: "Subscription required" });
    }

    next();
  } catch (err) {
    console.error("requireSubscription error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
