
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: function () {
        return this.role === 'admin'
      },
      minlength: 6,
      select: false
    },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  {
    timestamps: true
  }
)

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return

  this.password = await bcrypt.hash(this.password, 12)
})

// Compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false
  return bcrypt.compare(enteredPassword, this.password)
}

// User Model
const User = mongoose.model('User', userSchema)

module.exports = User
