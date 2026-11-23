
const express = require('express')
const mongoose = require('mongoose')

const Blog = require('../models/Blog')
const { protect } = require('../middleware/authMiddleware')

const router = express.Router()

// GET All Blog Posts (Public)
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Get all blogs successfully',
      data: blogs
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get blogs',
      error: error.message
    })
  }
})

// GET Single Blog by ID (Public)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid blog ID'
      })
    }

    const blog = await Blog.findById(req.params.id)

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      })
    }

    res.status(200).json({
      message: 'Get blog successfully',
      data: blog
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to get blog',
      error: error.message
    })
  }
})

// CREATE New Blog (Login Required)
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, image } = req.body

    if (!title || !content) {
      return res.status(400).json({
        message: 'Title and content are required'
      })
    }

    const newBlog = await Blog.create({
      title: title.trim(),
      content,
      author: req.user.name,
      user: req.user._id,
      image: image || ''
    })

    res.status(201).json({
      message: 'Blog created successfully',
      data: newBlog
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create blog',
      error: error.message
    })
  }
})

// UPDATE Blog (Owner or Admin Only)
router.put('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid blog ID'
      })
    }

    const blog = await Blog.findById(req.params.id)

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      })
    }

    const isOwner =
      blog.user &&
      blog.user.toString() === req.user._id.toString()

    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Access denied. You can only update your own blog.'
      })
    }

    // Update only provided fields
    if (req.body.title !== undefined) {
      if (!req.body.title.trim()) {
        return res.status(400).json({
          message: 'Title cannot be empty'
        })
      }

      blog.title = req.body.title.trim()
    }

    if (req.body.content !== undefined) {
      blog.content = req.body.content
    }

    if (req.body.image !== undefined) {
      blog.image = req.body.image
    }

    // Keep the original author name
    const updatedBlog = await blog.save()

    res.status(200).json({
      message: 'Blog updated successfully',
      data: updatedBlog
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update blog',
      error: error.message
    })
  }
})

// DELETE Blog (Owner or Admin Only)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid blog ID'
      })
    }

    const blog = await Blog.findById(req.params.id)

    if (!blog) {
      return res.status(404).json({
        message: 'Blog not found'
      })
    }

    const isOwner =
      blog.user &&
      blog.user.toString() === req.user._id.toString()

    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Access denied. You can only delete your own blog.'
      })
    }

    await Blog.findByIdAndDelete(req.params.id)

    res.status(200).json({
      message: 'Blog deleted successfully',
      data: blog
    })
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete blog',
      error: error.message
    })
  }
})

module.exports = router
