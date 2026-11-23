
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Hamburger menu state
const isMenuOpen = ref(false)

// Hide public navbar and footer on Login and Admin pages
const isAuthPage = computed(() =>
  route.path === '/login' || route.path.startsWith('/admin')
)

// Check whether the user is logged in
const isLoggedIn = computed(() => {
  route.fullPath
  return !!localStorage.getItem('token')
})

// Toggle hamburger menu
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// Close hamburger menu
const closeMenu = () => {
  isMenuOpen.value = false
}

// Close menu when navigating to another page
watch(() => route.fullPath, closeMenu)

// Sign out
const handleSignOut = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  closeMenu()
  router.push('/login')
}
</script>

<template>
  <div class="app">

    <!-- Public Navbar -->
    <header v-if="!isAuthPage" class="site-header">
      <nav class="navbar">

        <!-- Brand -->
        <router-link
          to="/"
          class="brand"
          @click="closeMenu"
        >
          <span class="brand-logo">B</span>
          <span class="brand-name">BlogSphere</span>
        </router-link>

        <!-- Navigation Links -->
        <div
          class="nav-links"
          :class="{ 'menu-open': isMenuOpen }"
        >
          <router-link
            to="/"
            class="nav-link"
            @click="closeMenu"
          >
            Home
          </router-link>

          <router-link
            to="/blogs"
            class="nav-link"
            @click="closeMenu"
          >
            Explore
          </router-link>

          <router-link
            v-if="isLoggedIn"
            to="/write"
            class="nav-link"
            @click="closeMenu"
          >
            Write a Story
          </router-link>

          <router-link
            to="/about"
            class="nav-link"
            @click="closeMenu"
          >
            About
          </router-link>

          <!-- Mobile Account Actions -->
          <div class="mobile-actions">

            <!-- Guest -->
            <template v-if="!isLoggedIn">
              <router-link
                to="/login"
                class="nav-login"
                @click="closeMenu"
              >
                Login
              </router-link>

              <router-link
                to="/login"
                class="nav-signup"
                @click="closeMenu"
              >
                Sign Up
              </router-link>
            </template>

            <!-- Logged-in User -->
            <template v-else>
              <router-link
                to="/write"
                class="nav-cta"
                @click="closeMenu"
              >
                Write a Story ↗
              </router-link>

              <button
                type="button"
                class="nav-signout"
                @click="handleSignOut"
              >
                Sign Out
              </button>
            </template>

          </div>
        </div>

        <!-- Desktop Account Actions -->
        <div class="nav-actions">

          <!-- Guest -->
          <template v-if="!isLoggedIn">
            <router-link
              to="/login"
              class="nav-login"
            >
              Login
            </router-link>

            <router-link
              to="/login"
              class="nav-signup"
            >
              Sign Up
            </router-link>
          </template>

          <!-- Logged-in User -->
          <template v-else>
            <router-link
              to="/write"
              class="nav-cta"
            >
              Write a Story ↗
            </router-link>

            <button
              type="button"
              class="nav-signout"
              @click="handleSignOut"
            >
              Sign Out
            </button>
          </template>

        </div>

        <!-- Hamburger Button -->
        <button
          type="button"
          class="hamburger"
          :class="{ 'is-active': isMenuOpen }"
          :aria-expanded="isMenuOpen"
          aria-label="Toggle navigation menu"
          @click="toggleMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </nav>
    </header>

    <!-- Page Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Public Footer -->
    <footer
      v-if="!isAuthPage"
      id="site-footer"
      class="site-footer"
    >
      <div class="footer-inner">

        <router-link to="/" class="footer-brand">
          BlogSphere
        </router-link>

        <p>A place where every idea has a story.</p>

        <span class="copyright">
          © 2026 BlogSphere. All rights reserved.
        </span>

      </div>
    </footer>

  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Global */
* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: 90px;
}

body {
  margin: 0;
  font-family: 'Inter', Arial, Helvetica, sans-serif;
  background: #ffffff;
  color: #101828;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: #1554e6;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.navbar {
  width: 100%;
  max-width: 1440px;
  min-height: 76px;
  margin: 0 auto;
  padding: 0 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 25px;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  background: #ffffff;
  color: #1554e6;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 800;
}

.brand-name {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* Desktop Navigation */
.nav-links {
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.nav-link {
  display: flex;
  align-items: center;
  color: #ffffff;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  transition: border-color 0.2s ease, opacity 0.2s ease;
}

.nav-link:hover {
  opacity: 0.85;
}

.nav-link.router-link-exact-active {
  border-bottom-color: #ffffff;
}

/* Account Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.nav-login,
.nav-signup,
.nav-signout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 20px;
  border-radius: 999px;
  text-decoration: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.nav-login {
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.nav-login:hover {
  background: rgba(255, 255, 255, 0.12);
}

.nav-signup,
.nav-cta {
  background: #ffffff;
  color: #101828;
}

.nav-signup:hover,
.nav-cta:hover {
  background: #eef2ff;
  transform: translateY(-2px);
}

.nav-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition: background 0.2s ease, transform 0.2s ease;
}

.nav-signout {
  color: #ffffff;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.nav-signout:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* Hamburger Button */
.hamburger {
  display: none;
  width: 42px;
  height: 42px;
  padding: 9px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
}

.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  margin: 5px 0;
  background: #ffffff;
  border-radius: 5px;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

/* Hamburger Animation */
.hamburger.is-active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.is-active span:nth-child(2) {
  opacity: 0;
}

.hamburger.is-active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile Account Actions */
.mobile-actions {
  display: none;
}

/* Main Content */
.main-content {
  width: 100%;
  margin: 0;
  padding: 0;
  flex: 1;
}

/* Footer */
.site-footer {
  width: 100%;
  background: #0f172a;
  color: #cbd5e1;
  padding: 35px 52px;
}

.footer-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.footer-brand {
  color: #ffffff;
  font-size: 21px;
  font-weight: 800;
  text-decoration: none;
}

.footer-inner p {
  margin: 0;
  font-size: 14px;
}

.copyright {
  color: #94a3b8;
  font-size: 13px;
}

/* Tablet and Mobile */
@media (max-width: 768px) {
  .navbar {
    min-height: 70px;
    padding: 12px 18px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .brand {
    margin-right: auto;
  }

  /* Show Hamburger */
  .hamburger {
    display: block;
    flex-shrink: 0;
  }

  /* Hide Desktop Actions */
  .nav-actions {
    display: none;
  }

  /* Hide Navigation until opened */
  .nav-links {
    display: none;
    order: 3;
    width: 100%;
    align-self: auto;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    padding: 10px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  /* Show Navigation when Hamburger is clicked */
  .nav-links.menu-open {
    display: flex;
  }

  .nav-link {
    padding: 14px 5px;
    border-bottom: none;
    font-size: 14px;
  }

  .nav-link.router-link-exact-active {
    opacity: 0.8;
  }

  /* Show Account Actions inside Mobile Menu */
  .mobile-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 0 5px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .mobile-actions a,
  .mobile-actions button {
    width: 100%;
  }

  .mobile-actions .nav-login,
  .mobile-actions .nav-signup,
  .mobile-actions .nav-cta,
  .mobile-actions .nav-signout {
    justify-content: center;
    text-align: center;
  }

  /* Footer */
  .footer-inner {
    flex-direction: column;
    text-align: center;
  }

  .site-footer {
    padding: 30px 18px;
  }
}
</style>
