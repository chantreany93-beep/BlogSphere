
const readline = require('readline')
require('dotenv').config()

const connectDB = require('./config/db')
const User = require('./models/User')

const ADMIN_ID = '6b02874121a72c69cd80129e'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function resetAdminPassword() {
  try {
    await connectDB()

    const admin = await User.findById(ADMIN_ID)

    if (!admin) {
      console.log('Admin account not found.')
      return
    }

    if (admin.email !== 'admin@gmail.com') {
      console.log('Admin email does not match.')
      return
    }

    rl.question('Enter your new Admin password: ', async (password) => {
      try {
        if (!password || password.length < 6) {
          console.log('Password must be at least 6 characters.')
          return
        }

        admin.password = password
        admin.role = 'admin'

        await admin.save()

        console.log('Admin password reset successfully!')
        console.log('Email:', admin.email)
        console.log('Role:', admin.role)

      } catch (error) {
        console.error('Reset failed:', error.message)
      } finally {
        rl.close()
        process.exit()
      }
    })

  } catch (error) {
    console.error('Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

resetAdminPassword()
