// controllers/authController.js
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const crypto = require("crypto");
const db = require("../config/db");  // your mysql2 connection
const { sendResetEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");

// Add to authController.js
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // ✅ Validate first (BEFORE hashing)
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Reset token missing/invalid" });
    }
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // ✅ Hash token only after validation
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1) Check token exists, unused, not expired
    const [rows] = await db.query(
      "SELECT email FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > NOW()",
      [tokenHash]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    const email = rows[0].email;

    // 2) Hash new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    // 3) Mark token as used
    await db.query("UPDATE password_resets SET used = 1 WHERE token_hash = ?", [
      tokenHash,
    ]);

    return res.json({ message: "Password reset successful! You can now sign in." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ error: "Server error during password reset." });
  }
};




const signup = async (req, res) => {
  const { name, email, password, country, state, city, whatsapp } = req.body;

  if (!name || !email || !password || !country || !state || !city || !whatsapp) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingUsers = await userModel.findUserByEmail(email);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.createUser(name, email, hashedPassword, country, state, city, whatsapp);

    res.status(201).json({ message: 'Signup successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await userModel.findUserByEmail(email);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
  { email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);


    // ✅ Send user data back to frontend
    res.status(200).json({
  message: "Signin successful",
  token,
  user: {
    name: user.name,
    email: user.email,
    country: user.country,
    state: user.state,
    city: user.city,
    whatsapp: user.whatsapp
  }
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signin failed' });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1) Check if user exists
    const [users] = await db.query("SELECT email FROM users WHERE email = ?", [email]);

    // Always return same message for security reasons
    if (!users || users.length === 0) {
      return res.json({ message: "If the email exists, a reset link has been sent." });
    }

    // 2) Generate token and hash it for storage
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);  // token expires in 15 minutes

    // 3) Save token to password_resets table
    await db.query(
      "INSERT INTO password_resets (email, token_hash, expires_at, used) VALUES (?, ?, ?, 0)",
      [email, tokenHash, expiresAt]
    );

    // 4) Send the reset link email
    const resetLink = `http://localhost:5000/reset-password.html?token=${rawToken}`;
    await sendResetEmail(email, resetLink);

    return res.json({ message: "If the email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
module.exports = { signup, signin, forgotPassword, resetPassword };

 