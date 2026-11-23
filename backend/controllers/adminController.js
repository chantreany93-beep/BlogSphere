
const User = require('../models/User')

// Get All Users (Admin Only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Get all users successfully',
      totalUsers: users.length,
      data: users
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get users',
      error: error.message
    })
  }
}

module.exports = {
  getAllUsers
}
