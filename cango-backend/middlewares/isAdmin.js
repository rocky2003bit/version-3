const userModel = require('../models/userModel');

const isAdmin = async (req, res, next) => {
  try {
    const email = req.headers['x-admin-email'];

    console.log("🔐 Admin header:", email);

    if (!email) {
      return res.status(401).json({ error: 'No admin email header' });
    }

    const users = await userModel.findUserByEmail(email);

    console.log("👤 Admin DB result:", users);

    if (!users.length || users[0].is_admin !== 1) {
      return res.status(403).json({ error: 'Not an admin' });
    }

    next(); // ✅ THIS WAS NEVER BEING REACHED
  } catch (err) {
    console.error("❌ isAdmin error:", err);
    res.status(500).json({ error: 'Admin verification failed' });
  }
};

module.exports = isAdmin;
