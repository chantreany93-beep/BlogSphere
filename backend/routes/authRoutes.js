
const express = require('express')

const {
  registerUser,
  loginUser,
  getMe,
  sendOtp,
  verifyOtp
} = require('../controllers/authController')

const { protect, adminOnly } = require('../middleware/authMiddleware')

const router = express.Router()

// Register User
router.post('/register', registerUser)

// Login User (Email + Password)
router.post('/login', loginUser)

// Send OTP to Email
router.post('/send-otp', sendOtp)

// Verify OTP
router.post('/verify-otp', verifyOtp)

// Get Logged-in User Profile
router.get('/me', protect, getMe)

// Admin Test Route
router.get('/admin', protect, adminOnly, (req, res) => {
  res.json({
    message: 'Welcome Admin! Access granted.'
  })
})

module.exports = router
