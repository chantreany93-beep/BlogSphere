
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/blogs',
    name: 'Blogs',
    component: () => import('../views/BlogsView.vue')
  },
  {
    path: '/write',
    name: 'Write',
    component: () => import('../views/WriteView.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboardView.vue'),
    meta: {
      requiresAdmin: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior(to) {
    if (to.hash) {
      return {
        el: to.hash,
        top: 90,
        behavior: 'smooth'
      }
    }

    return { top: 0 }
  }
})

// Admin Route Protection
router.beforeEach(async (to) => {

  // Public pages do not need authentication
  if (!to.meta.requiresAdmin) {
    return true
  }

  // Get JWT token
  const token = localStorage.getItem('token')

  // Redirect guest to login
  if (!token) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath }
    }
  }

  try {
    // Verify token and get user profile
    const response = await fetch(
      '/api/auth/me',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    // Invalid or expired token
    if (response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      return {
        name: 'Login',
        query: { redirect: to.fullPath }
      }
    }

    if (!response.ok) {
      console.error('Profile request failed:', response.status)
      return false
    }

    const result = await response.json()

    // Support both API response formats
    const userData = result.user || result.data
    const userRole = userData?.role

    console.log('CURRENT USER:', userData)
    console.log('CURRENT USER ROLE:', userRole)

    // Update stored user information
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    }

    // Only admin can access Admin Dashboard
    if (userRole === 'admin') {
      return true
    }

    // Normal users cannot access Admin Dashboard
    if (userRole === 'user') {
      return {
        name: 'Blogs'
      }
    }

    // Unknown role
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    return {
      name: 'Login'
    }

  } catch (error) {
    console.error('Admin authentication error:', error)
    return false
  }
})

export default router
