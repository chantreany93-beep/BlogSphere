
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const blogRoutes = require('./routes/blogRoutes')

const app = express()

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Authentication Routes
app.use('/api/auth', authRoutes)

// Admin Routes
app.use('/api/admin', adminRoutes)

// Blog Routes
app.use('/api/blogs', blogRoutes)

// Welcome API
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BlogSphere API',
    status: 'Server is running'
  })
})

// Server Port
const PORT = process.env.PORT || 5000

// Connect Database and Start Server
const startServer = async () => {
  try {
    await connectDB()

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`BlogSphere server running on port ${PORT}`)
      console.log('Server is listening...')
    })

    server.on('error', (error) => {
      console.error('Server error:', error.message)
    })

  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()
