
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Protect Routes
const protect = async (req, res, next) => {
  let token

  // Check Authorization Header
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  // Check Token
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    })
  }

  try {
    // Verify JWT Token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    // Find User
    const user = await User.findById(decoded.id).select('-password')

    if (!user) {
      return res.status(401).json({
        message: 'User not found'
      })
    }

    // Attach User to Request
    req.user = user

    next()
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized, invalid token'
    })
  }
}

// Check Admin Role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }

  return res.status(403).json({
    message: 'Access denied. Admin only.'
  })
}

// Export Middleware
module.exports = {
  protect,
  adminOnly
}
