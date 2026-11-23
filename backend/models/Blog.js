
const mongoose = require('mongoose')

// Blog Schema
const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    content: {
      type: String,
      required: true
    },

    author: {
      type: String,
      required: true
    },

    // Blog Owner (User Reference)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Cover image (stored as a data URL string, optional)
    image: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

// Blog Model
const Blog = mongoose.model('Blog', blogSchema)

module.exports = Blog
