
const User = require('../models/User')
const Otp = require('../models/Otp')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { sendOtpEmail } = require('../services/emailService')

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Generate secure OTP hash
const hashOtp = (email, otp) => {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(`${email}:${otp}`)
    .digest('hex')
}

// Register User (Email + Password)
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Please provide name, email, and password'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      email: normalizedEmail
    })

    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered'
      })
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password
    })

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Register error:', error.message)

    return res.status(500).json({
      message: 'Registration failed'
    })
  }
}

// Login User (Email + Password)
// Admin can continue using this login method
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      })
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password')

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      })
    }

    const token = generateToken(user._id)

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Login error:', error.message)

    return res.status(500).json({
      message: 'Login failed'
    })
  }
}

// Get Logged-in User Profile
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'User profile retrieved successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    })

  } catch (error) {
    console.error('Get profile error:', error.message)

    return res.status(500).json({
      message: 'Failed to get user profile'
    })
  }
}

// Send OTP to Email
const sendOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address'
      })
    }

    // Admin must use password login
    const existingUser = await User.findOne({ email })

    if (existingUser?.role === 'admin') {
      return res.status(403).json({
        message: 'Admin must login using email and password'
      })
    }

    // Check existing OTP
    const existingOtp = await Otp.findOne({ email })

    // 60-second resend cooldown
    if (
      existingOtp &&
      Date.now() - existingOtp.lastSentAt.getTime() < 60000
    ) {
      return res.status(429).json({
        message: 'Please wait 60 seconds before requesting another OTP'
      })
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString()

    const otpHash = hashOtp(email, otp)

    // Save OTP hash
    if (existingOtp) {
      existingOtp.otpHash = otpHash
      existingOtp.expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      existingOtp.attempts = 0
      existingOtp.lastSentAt = new Date()

      await existingOtp.save()
    } else {
      await Otp.create({
        email,
        otpHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        lastSentAt: new Date()
      })
    }

    // Send OTP email
    try {
      await sendOtpEmail(email, otp)
    } catch (emailError) {
      await Otp.deleteOne({ email })

      console.error('Email sending error:', emailError.message)

      return res.status(502).json({
        message: 'Failed to send verification email'
      })
    }

    return res.status(200).json({
      message: 'OTP sent successfully. Please check your email.'
    })

  } catch (error) {
    console.error('Send OTP error:', error.message)

    return res.status(500).json({
      message: 'Failed to send OTP'
    })
  }
}

// Verify OTP and Login User
const verifyOtp = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const otp = String(req.body.otp || '').trim()

    // Validate input
    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        message: 'Please provide a valid email and 6-digit OTP'
      })
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ email })

    if (!otpRecord) {
      return res.status(400).json({
        message: 'OTP not found. Please request a new OTP.'
      })
    }

    // Check expiration
    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      await Otp.deleteOne({ email })

      return res.status(400).json({
        message: 'OTP has expired. Please request a new OTP.'
      })
    }

    // Maximum 5 attempts
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ email })

      return res.status(429).json({
        message: 'Too many attempts. Please request a new OTP.'
      })
    }

    // Compare OTP hashes safely
    const submittedHash = hashOtp(email, otp)

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(submittedHash, 'hex'),
      Buffer.from(otpRecord.otpHash, 'hex')
    )

    if (!isMatch) {
      otpRecord.attempts += 1

      await otpRecord.save()

      return res.status(400).json({
        message: 'Invalid OTP',
        remainingAttempts: 5 - otpRecord.attempts
      })
    }

    // Find existing user
    let user = await User.findOne({ email })

    // Admin cannot login using OTP
    if (user?.role === 'admin') {
      await Otp.deleteOne({ email })

      return res.status(403).json({
        message: 'Admin must login using email and password'
      })
    }

    // Check whether this is a new user
    const isNewUser = !user

    // Create new user after successful OTP verification
    if (isNewUser) {
      const generatedName = email
        .split('@')[0]
        .replace(/[._-]/g, ' ')

      user = await User.create({
        name: generatedName,
        email,
        role: 'user'
      })
    }

    // Delete OTP after successful verification
    await Otp.deleteOne({ email })

    // Generate JWT Token
    const token = generateToken(user._id)

    return res.status(200).json({
      message: isNewUser
        ? 'Account created successfully.'
        : 'Login successful.',
      isNewUser,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Verify OTP error:', error.message)

    return res.status(500).json({
      message: 'OTP verification failed'
    })
  }
}

// Export Controllers
module.exports = {
  registerUser,
  loginUser,
  getMe,
  sendOtp,
  verifyOtp
}
