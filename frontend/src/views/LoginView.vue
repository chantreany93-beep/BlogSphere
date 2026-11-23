
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const API_URL = '/api/auth'

const email = ref('')
const password = ref('')
const otp = ref('')

const loginMode = ref('user')
const otpSent = ref(false)

const loading = ref(false)
const error = ref('')
const success = ref('')

// New user welcome screen
const registrationComplete = ref(false)

// Store login information and redirect by role
const saveLogin = async (result) => {
  const userData = result.user || result.data
  const userRole = userData?.role

  if (!result.token) {
    throw new Error('Login token not found. Please try again.')
  }

  if (!userRole) {
    throw new Error('User role not found. Please contact the administrator.')
  }

  if (loginMode.value === 'admin' && userRole !== 'admin') {
    throw new Error('This account does not have administrator access.')
  }

  if (loginMode.value === 'user' && userRole !== 'user') {
    throw new Error('Please use the correct login method for this account.')
  }

  localStorage.setItem('token', result.token)
  localStorage.setItem('user', JSON.stringify(userData))

  return userData
}

// USER: Send OTP
const sendOtp = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await fetch(`${API_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value.trim()
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send OTP.')
    }

    otpSent.value = true
    success.value =
      result.message || 'OTP sent successfully. Please check your email.'
  } catch (err) {
    error.value = err.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

// USER: Verify OTP
const verifyOtp = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value.trim(),
        otp: otp.value.trim()
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'OTP verification failed.')
    }

    await saveLogin(result)

    // Backend must return isNewUser: true or false
    if (result.isNewUser === true) {
      registrationComplete.value = true
      success.value = ''
      return
    }

    // Existing user
    await router.replace('/blogs')

  } catch (err) {
    error.value = err.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

// New user: Continue to BlogSphere
const exploreBlogs = () => {
  router.replace('/blogs')
}

// ADMIN: Email and Password Login
const loginAdmin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Login failed.')
    }

    await saveLogin(result)
    await router.replace('/admin')

  } catch (err) {
    error.value = err.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

// Change login method
const changeLoginMode = (mode) => {
  loginMode.value = mode
  otpSent.value = false
  otp.value = ''
  password.value = ''
  error.value = ''
  success.value = ''
  registrationComplete.value = false
}

// Change email before verifying OTP
const changeEmail = () => {
  otpSent.value = false
  otp.value = ''
  error.value = ''
  success.value = ''
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">

      <!-- NEW USER WELCOME SCREEN -->
      <div v-if="registrationComplete" class="welcome-screen">

        <div class="welcome-icon">
          ✓
        </div>

        <h1>Welcome to BlogSphere!</h1>

        <p class="welcome-description">
          Your account has been created successfully.
        </p>

        <div class="welcome-info">
          <h3>Your account is ready!</h3>
          <p>
            Discover stories, share your ideas, and connect
            with our community.
          </p>
        </div>

        <button
          type="button"
          class="explore-button"
          @click="exploreBlogs"
        >
          Explore BlogSphere →
        </button>

      </div>

      <!-- LOGIN SCREEN -->
      <template v-else>

        <div class="login-header">
          <h1>
            {{ loginMode === 'user' ? 'Welcome to BlogSphere!' : 'Admin Login' }}
          </h1>

          <p>
            {{
              loginMode === 'user'
                ? 'Sign in to continue your journey with BlogSphere.'
                : 'Sign in to your administrator account.'
            }}
          </p>
        </div>

        <!-- Login Method -->
        <div class="login-tabs">
          <button
            type="button"
            :class="{ active: loginMode === 'user' }"
            @click="changeLoginMode('user')"
          >
            User Login
          </button>

          <button
            type="button"
            :class="{ active: loginMode === 'admin' }"
            @click="changeLoginMode('admin')"
          >
            Admin Login
          </button>
        </div>

        <!-- USER LOGIN -->
        <form
          v-if="loginMode === 'user'"
          @submit.prevent="otpSent ? verifyOtp() : sendOtp()"
        >
          <div class="form-group">
            <label for="user-email">Email Address</label>

            <input
              id="user-email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              :disabled="otpSent || loading"
              required
            />
          </div>

          <div v-if="otpSent" class="form-group">
            <label for="otp">Verification Code</label>

            <input
              id="otp"
              v-model="otp"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="Enter 6-digit OTP"
              autocomplete="one-time-code"
              required
            />

            <button
              type="button"
              class="text-button"
              @click="changeEmail"
            >
              Change email address
            </button>
          </div>

          <p v-if="error" class="error-message">
            {{ error }}
          </p>

          <p v-if="success" class="success-message">
            {{ success }}
          </p>

          <button type="submit" :disabled="loading">
            {{
              loading
                ? 'Please wait...'
                : otpSent
                  ? 'Verify & Continue'
                  : 'Send OTP'
            }}
          </button>
        </form>

        <!-- ADMIN LOGIN -->
        <form v-else @submit.prevent="loginAdmin">

          <div class="form-group">
            <label for="admin-email">Admin Email</label>

            <input
              id="admin-email"
              v-model="email"
              type="email"
              placeholder="Enter admin email"
              autocomplete="username"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="error" class="error-message">
            {{ error }}
          </p>

          <button type="submit" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Admin Sign In' }}
          </button>

        </form>

        <p class="login-footer">
          Welcome to <strong>BlogSphere</strong>
        </p>

      </template>

    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background: #f9fafb;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 40px;
  background: #ffffff;
  border: 1px solid #eaecf0;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
}

/* Login Header */
.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-header h1 {
  margin: 0 0 10px;
  color: #101828;
  font-size: 30px;
  font-weight: 700;
}

.login-header p {
  margin: 0;
  color: #667085;
  font-size: 15px;
}

/* Login Tabs */
.login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 25px;
  padding: 5px;
  background: #f2f4f7;
  border-radius: 10px;
}

.login-tabs button {
  flex: 1;
  padding: 11px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #667085;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.login-tabs button.active {
  background: #ffffff;
  color: #1554e6;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.12);
}

/* Form */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  color: #344054;
  font-size: 14px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  outline: none;
  font: inherit;
  font-size: 15px;
  box-sizing: border-box;
}

.form-group input:focus {
  border-color: #1554e6;
  box-shadow: 0 0 0 4px #dbe6fd;
}

.form-group input:disabled {
  background: #f2f4f7;
  cursor: not-allowed;
}

/* Submit Button */
button[type="submit"],
.explore-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: #1554e6;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

button[type="submit"]:hover,
.explore-button:hover {
  background: #1145c2;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Messages */
.text-button {
  align-self: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  color: #1554e6;
  font-size: 13px;
  cursor: pointer;
}

.error-message {
  margin: 0 0 16px;
  color: #d92d20;
  font-size: 14px;
}

.success-message {
  margin: 0 0 16px;
  color: #067647;
  font-size: 14px;
}

/* Login Footer */
.login-footer {
  margin: 25px 0 0;
  text-align: center;
  color: #667085;
  font-size: 14px;
}

/* New User Welcome Screen */
.welcome-screen {
  text-align: center;
}

.welcome-icon {
  width: 68px;
  height: 68px;
  margin: 0 auto 22px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #dcfae6;
  color: #067647;
  font-size: 36px;
  font-weight: 700;
}

.welcome-screen h1 {
  margin: 0 0 12px;
  color: #101828;
  font-size: 27px;
  line-height: 1.3;
}

.welcome-description {
  margin: 0 0 25px;
  color: #667085;
  font-size: 15px;
  line-height: 1.6;
}

.welcome-info {
  margin-bottom: 25px;
  padding: 20px;
  border-radius: 12px;
  background: #f2f4f7;
  text-align: left;
}

.welcome-info h3 {
  margin: 0 0 8px;
  color: #101828;
  font-size: 16px;
}

.welcome-info p {
  margin: 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 22px;
  }
}
</style>
