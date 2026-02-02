const express = require('express');
const router = express.Router();
const { signup, signin, forgotPassword, resetPassword } = require('../controllers/authController');

// Signup route
router.post('/signup', signup);

// Signin route ✅
router.post('/signin', signin);

router.post('/forgot-password', forgotPassword);

// Add to routes/authRoutes.js
router.post('/reset-password', resetPassword);


module.exports = router;
