
<script setup>
import { ref, computed, onMounted } from 'vue'

const API_URL = '/api/admin/users'
const BLOG_API_URL = '/api/blogs'

// DATABASE DATA
const users = ref([])
const blogs = ref([])

const loading = ref(false)
const blogLoading = ref(false)
const error = ref('')
const blogError = ref('')

// FETCH ALL USERS
const fetchUsers = async () => {
  loading.value = true
  error.value = ''

  try {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('Please login as admin first.')
    }

    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load users')
    }

    users.value = result.data || []
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// FETCH ALL BLOGS
const fetchBlogs = async () => {
  blogLoading.value = true
  blogError.value = ''

  try {
    const response = await fetch(BLOG_API_URL)
    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to load blogs')
    }

    blogs.value = result.data || []
  } catch (err) {
    blogError.value = err.message
  } finally {
    blogLoading.value = false
  }
}

// REFRESH DASHBOARD
const refreshDashboard = async () => {
  await Promise.all([
    fetchUsers(),
    fetchBlogs()
  ])
}

// CALCULATE STATISTICS
const adminCount = computed(() =>
  users.value.filter(user => user.role === 'admin').length
)

const userCount = computed(() =>
  users.value.filter(user => user.role === 'user').length
)

const stats = computed(() => [
  {
    label: 'Total Users',
    value: users.value.length
  },
  {
    label: 'Total Blogs',
    value: blogs.value.length
  },
  {
    label: 'Administrators',
    value: adminCount.value
  },
  {
    label: 'Regular Users',
    value: userCount.value
  }
])

onMounted(() => {
  refreshDashboard()
})

// UI STATE
const activeNav = ref('Dashboard')
const theme = ref('light')
const collapsed = ref(false)

// SIDEBAR MENU WITH SVG ICON TYPES
const navItems = [
  { name: 'Dashboard', icon: 'dashboard' },
  { name: 'Posts', icon: 'posts' },
  { name: 'Categories', icon: 'categories' },
  { name: 'Media', icon: 'media' },
  { name: 'Pages', icon: 'pages' },
  { name: 'Comments', icon: 'comments' }
]

const systemItems = [
  { name: 'Appearance', icon: 'appearance' },
  { name: 'Settings', icon: 'settings' }
]

// LIVE POST GROWTH — LAST 6 MONTHS
const hoverBar = ref(0)

const postMonths = computed(() => {
  const now = new Date()

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    )

    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString('en-US', {
        month: 'short'
      })
    }
  })
})

const postGrowth = computed(() =>
  postMonths.value.map(({ year, month }) =>
    blogs.value.filter(blog => {
      if (!blog.createdAt) return false

      const date = new Date(blog.createdAt)

      return (
        date.getFullYear() === year &&
        date.getMonth() === month
      )
    }).length
  )
)

const months = computed(() =>
  postMonths.value.map(item => item.label)
)

const postChartMax = computed(() =>
  Math.max(
    5,
    Math.ceil(Math.max(...postGrowth.value, 0) / 5) * 5
  )
)

const postGridValues = computed(() =>
  Array.from({ length: 6 }, (_, i) =>
    (postChartMax.value / 5) * i
  )
)

// LIVE USER GROWTH — LAST 15 DAYS
const userGrowthDays = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 15 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (14 - index))

    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const count = users.value.filter(user => {
      if (!user.createdAt) return false

      const createdDate = new Date(user.createdAt)

      return createdDate >= date && createdDate < nextDate
    }).length

    return {
      day: date.getDate(),
      count
    }
  })
})

const userChartMax = computed(() =>
  Math.max(
    5,
    Math.ceil(
      Math.max(
        ...userGrowthDays.value.map(item => item.count),
        0
      ) / 5
    ) * 5
  )
)

const gridValues = computed(() =>
  Array.from({ length: 6 }, (_, i) =>
    (userChartMax.value / 5) * i
  )
)

// RECENT BLOGS
const recentBlogs = computed(() =>
  [...blogs.value]
    .sort((a, b) =>
      new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0)
    )
    .slice(0, 5)
)

// SEARCH STATE
const userSearch = ref('')
const blogSearch = ref('')

// FILTER USERS
const filteredUsers = computed(() => {
  const keyword = userSearch.value.trim().toLowerCase()

  if (!keyword) return users.value

  return users.value.filter(user =>
    user.name?.toLowerCase().includes(keyword) ||
    user.email?.toLowerCase().includes(keyword) ||
    user.role?.toLowerCase().includes(keyword)
  )
})

// FILTER RECENT BLOGS
const filteredBlogs = computed(() => {
  const keyword = blogSearch.value.trim().toLowerCase()

  if (!keyword) return recentBlogs.value

  return recentBlogs.value.filter(blog =>
    blog.title?.toLowerCase().includes(keyword) ||
    blog.author?.toLowerCase().includes(keyword)
  )
})

// LINE CHART
const W = 600
const H = 220

const PAD = {
  l: 30,
  r: 10,
  t: 10,
  b: 24
}

const series = computed(() => [
  {
    name: 'New Users',
    color: '#2563eb',
    data: userGrowthDays.value.map(item => item.count)
  }
])

const xAt = i =>
  PAD.l + (i * (W - PAD.l - PAD.r)) / 14

const yAt = v =>
  PAD.t +
  (1 - v / userChartMax.value) *
  (H - PAD.t - PAD.b)

const smoothPath = data => {
  const pts = data.map((v, i) => [
    xAt(i),
    yAt(v)
  ])

  if (!pts.length) return ''

  let d = `M ${pts[0][0]} ${pts[0][1]}`

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2

    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6

    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }

  return d
}
</script>

<template>
  <div class="shell" :class="[theme, { collapsed }]">

    <!-- SIDEBAR -->
    <aside class="sidebar">

      <!-- LOGO -->
      <div class="logo">
        <div class="logo-brand">
          <span class="logo-dots"></span>
          <strong class="label">BLOG<span>SPHERE</span></strong>
        </div>

        <button
          class="collapse-btn"
          title="Toggle sidebar"
          @click="collapsed = !collapsed"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 6h10M4 12h7M4 18h10M20 8l-4 4 4 4" />
          </svg>
        </button>
      </div>

      <!-- MAIN MENU -->
      <nav>

        <a
          v-for="item in navItems"
          :key="item.name"
          :class="['nav-item', { active: activeNav === item.name }]"
          @click="activeNav = item.name"
        >
          <svg
            class="nav-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >

            <!-- DASHBOARD ICON -->
            <template v-if="item.icon === 'dashboard'">
              <rect x="3" y="3" width="8" height="8" rx="2"/>
              <rect x="13" y="3" width="8" height="5" rx="2"/>
              <rect x="13" y="10" width="8" height="11" rx="2"/>
              <rect x="3" y="13" width="8" height="8" rx="2"/>
            </template>

            <!-- POSTS ICON -->
            <template v-else-if="item.icon === 'posts'">
              <path d="M5 3h10l4 4v14H5z"/>
              <path d="M15 3v5h4M8 12h8M8 16h8"/>
            </template>

            <!-- CATEGORIES ICON -->
            <template v-else-if="item.icon === 'categories'">
              <rect x="3" y="3" width="8" height="8" rx="2"/>
              <rect x="13" y="3" width="8" height="8" rx="2"/>
              <rect x="3" y="13" width="8" height="8" rx="2"/>
              <rect x="13" y="13" width="8" height="8" rx="2"/>
            </template>

            <!-- MEDIA ICON -->
            <template v-else-if="item.icon === 'media'">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <circle cx="8.5" cy="9" r="1.5"/>
              <path d="m21 15-5-5L5 20"/>
            </template>

            <!-- PAGES ICON -->
            <template v-else-if="item.icon === 'pages'">
              <path d="M5 3h10l4 4v14H5z"/>
              <path d="M15 3v5h4M8 12h8M8 16h8"/>
            </template>

            <!-- COMMENTS ICON -->
            <template v-else-if="item.icon === 'comments'">
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>
            </template>

          </svg>

          <span class="label">{{ item.name }}</span>
        </a>

        <!-- SYSTEM SECTION -->
        <p class="nav-title">SYSTEM</p>

        <a
          v-for="item in systemItems"
          :key="item.name"
          :class="['nav-item', { active: activeNav === item.name }]"
          @click="activeNav = item.name"
        >
          <svg
            class="nav-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          >

            <!-- APPEARANCE ICON -->
            <template v-if="item.icon === 'appearance'">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 3v18M3 12h18"/>
            </template>

            <!-- SETTINGS ICON -->
            <template v-else-if="item.icon === 'settings'">
              <circle cx="12" cy="12" r="3"/>
              <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-2 .9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-2-.9l-1.7.7-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2.2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 2-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 2 .9l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2.1z"/>
            </template>

          </svg>

          <span class="label">{{ item.name }}</span>
        </a>

      </nav>

      <!-- THEME TOGGLE -->
      <div class="theme-toggle">

        <button
          :class="{ on: theme === 'light' }"
          @click="theme = 'light'"
        >
          ☀ Light
        </button>

        <button
          :class="{ on: theme === 'dark' }"
          @click="theme = 'dark'"
        >
          ☾ Dark
        </button>

      </div>

    </aside>

    <!-- MAIN CONTENT -->
    <main class="main">

      <!-- TOP NAVBAR -->
      <header class="topbar">

        <div class="topbar-left">
          <small>Welcome back 👋</small>
          <h3>Admin Dashboard</h3>
        </div>

        <div class="topbar-right">

          <!-- REFRESH BUTTON -->
          <button
            class="icon-btn"
            :class="{ spin: loading || blogLoading }"
            :disabled="loading || blogLoading"
            title="Refresh Dashboard"
            @click="refreshDashboard"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
            </svg>

            <i class="dot"></i>
          </button>

          <!-- ADMIN PROFILE -->
          <div class="profile">
            <span class="avatar">A</span>

            <div class="profile-info">
              <strong>Administrator</strong>
              <small>Super Admin</small>
            </div>
          </div>

        </div>

      </header>

      <!-- DASHBOARD CONTENT -->
      <section class="content">

        <!-- STAT CARDS -->
        <div class="stats">

          <div
            v-for="s in stats"
            :key="s.label"
            class="card stat"
          >
            <span class="stat-icon"></span>

            <p class="muted">{{ s.label }}</p>

            <h2>{{ s.value }}</h2>

            <div class="stat-foot">
              <span class="muted">Live database data</span>
              <span class="pill up">Live</span>
            </div>
          </div>

        </div>

        <!-- CHARTS -->
        <div class="row">

          <!-- POST GROWTH -->
          <div class="card">

            <div class="card-head">
              <h4>Post Growth</h4>
              <span class="select">6 months</span>
            </div>

            <p class="legend">
              <i
                class="sq"
                style="background:#2563eb"
              ></i>
              Total number of posts
            </p>

            <div class="bar-chart">

              <div class="y-axis">
                <span
                  v-for="v in [...postGridValues].reverse()"
                  :key="v"
                >
                  {{ v }}
                </span>
              </div>

              <div class="bars">

                <div
                  v-for="(v, i) in postGrowth"
                  :key="i"
                  class="bar-col"
                  @mouseenter="hoverBar = i"
                >
                  <div class="bar-track">

                    <div
                      v-if="hoverBar === i"
                      class="tooltip"
                    >
                      {{ v }} posts
                    </div>

                    <div
                      class="bar"
                      :class="{ active: hoverBar === i }"
                      :style="{
                        height: (v / postChartMax) * 100 + '%'
                      }"
                    ></div>

                  </div>

                  <span class="x-label">
                    {{ months[i] }}
                  </span>

                </div>

              </div>
            </div>

          </div>

          <!-- USER GROWTH -->
          <div class="card">

            <div class="card-head">
              <h4>User Growth</h4>
              <span class="select">Last 15 days</span>
            </div>

            <p class="legend">
              <span class="legend-item">
                <i
                  class="sq"
                  style="background:#2563eb"
                ></i>
                New registered users
              </span>
            </p>

            <svg
              :viewBox="`0 0 ${W} ${H}`"
              class="line-chart"
            >

              <g
                v-for="v in gridValues"
                :key="v"
              >
                <line
                  :x1="PAD.l"
                  :x2="W - PAD.r"
                  :y1="yAt(v)"
                  :y2="yAt(v)"
                  stroke="#d0d5dd"
                  stroke-dasharray="3 4"
                />

                <text
                  :x="PAD.l - 8"
                  :y="yAt(v) + 4"
                  text-anchor="end"
                  class="axis"
                >
                  {{ v }}
                </text>
              </g>

              <text
                v-for="i in 15"
                :key="i"
                :x="xAt(i - 1)"
                :y="H - 4"
                text-anchor="middle"
                class="axis"
              >
                {{ userGrowthDays[i - 1]?.day }}
              </text>

              <path
                v-for="s in series"
                :key="s.name"
                :d="smoothPath(s.data)"
                fill="none"
                :stroke="s.color"
                stroke-width="2"
              />

              <circle
                v-for="(value, index) in series[0].data"
                :key="index"
                :cx="xAt(index)"
                :cy="yAt(value)"
                r="3"
                :fill="series[0].color"
              />

            </svg>

          </div>

        </div>

        <!-- TABLES -->
        <div class="row">

          <!-- LATEST USERS -->
          <div class="card table-card">

            <div class="table-title">
              <h4>Latest Users</h4>

              <div class="table-search">

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>

                <input
                  v-model="userSearch"
                  type="text"
                  placeholder="Search name, email, role..."
                />

                <button
                  v-if="userSearch"
                  class="clear-search"
                  @click="userSearch = ''"
                  title="Clear search"
                >
                  ×
                </button>

              </div>
            </div>

            <p
              v-if="loading"
              class="pad"
            >
              Loading users...
            </p>

            <p
              v-else-if="error"
              class="pad error"
            >
              {{ error }}
            </p>

            <div
              v-else
              class="table-wrapper"
            >

              <table>

                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  <tr
                    v-for="user in filteredUsers.slice(0, 5)"
                    :key="user._id"
                  >
                    <td>{{ user.name }}</td>
                    <td>{{ user.email }}</td>

                    <td>
                      <span
                        :class="['status', user.role]"
                      >
                        {{ user.role }}
                      </span>
                    </td>

                    <td>
                      {{
                        user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : 'N/A'
                      }}
                    </td>
                  </tr>

                  <tr v-if="filteredUsers.length === 0">
                    <td colspan="4" class="empty-result">
                      No results found.
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          <!-- RECENT BLOGS -->
          <div class="card table-card">

            <div class="table-title">
              <h4>Recent Blogs</h4>

              <div class="table-search">

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>

                <input
                  v-model="blogSearch"
                  type="text"
                  placeholder="Search blog title or author..."
                />

                <button
                  v-if="blogSearch"
                  class="clear-search"
                  @click="blogSearch = ''"
                  title="Clear search"
                >
                  ×
                </button>

              </div>
            </div>

            <p
              v-if="blogLoading"
              class="pad"
            >
              Loading blogs...
            </p>

            <p
              v-else-if="blogError"
              class="pad error"
            >
              {{ blogError }}
            </p>

            <div
              v-else
              class="table-wrapper"
            >

              <table>

                <thead>
                  <tr>
                    <th>Blog Title</th>
                    <th>Author</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>

                  <tr
                    v-for="blog in filteredBlogs"
                    :key="blog._id"
                  >
                    <td>{{ blog.title }}</td>
                    <td>{{ blog.author }}</td>

                    <td>
                      {{
                        blog.createdAt
                          ? new Date(blog.createdAt).toLocaleDateString()
                          : 'N/A'
                      }}
                    </td>
                  </tr>

                  <tr v-if="filteredBlogs.length === 0">
                    <td colspan="3" class="empty-result">
                      No blogs found.
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </section>

    </main>

  </div>
</template>

<style scoped>
/* MAIN SHELL */
.shell {
  --bg: #f3f5fb;
  --surface: #ffffff;
  --text: #101828;
  --muted: #667085;
  --border: #eaecf0;
  --head: #f2f4f9;
  --primary: #2563eb;

  display: flex;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, sans-serif;
}

.shell.dark {
  --bg: #0b1020;
  --surface: #131a2e;
  --text: #f2f4f7;
  --muted: #98a2b3;
  --border: #232c45;
  --head: #1a2340;
}

/* SIDEBAR */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  transition: width 0.2s;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  font-size: 15px;
}

.logo-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo span {
  font-weight: 500;
}

.logo-dots {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 4px;
  background: radial-gradient(
    circle,
    var(--primary) 30%,
    transparent 32%
  ) 0 0 / 6px 6px;
}

.collapse-btn {
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  display: grid;
  place-items: center;
}

.collapse-btn:hover {
  color: var(--primary);
}

/* NAVIGATION */
nav {
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  margin-bottom: 6px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--head);
}

.nav-item.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}

/* SVG NAV ICONS */
.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.85;
  transition: 0.2s;
}

.nav-item.active .nav-icon {
  opacity: 1;
}

.nav-title {
  margin: 22px 14px 10px;
  font-size: 11px;
  letter-spacing: 1px;
  color: var(--muted);
}

/* THEME TOGGLE */
.theme-toggle {
  display: flex;
  padding: 4px;
  border-radius: 999px;
  background: var(--head);
  border: 1px solid var(--border);
}

.theme-toggle button {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
}

.theme-toggle button.on {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

/* COLLAPSED SIDEBAR */
.shell.collapsed .sidebar {
  width: 76px;
}

.shell.collapsed .label,
.shell.collapsed .nav-title,
.shell.collapsed .theme-toggle {
  display: none;
}

.shell.collapsed .logo {
  flex-direction: column;
  gap: 12px;
}

.shell.collapsed .nav-item {
  justify-content: center;
  padding-left: 10px;
  padding-right: 10px;
}

/* MAIN */
.main {
  flex: 1;
  min-width: 0;
}

/* TOP NAVBAR */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.topbar-left small {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.topbar-left h3 {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* REFRESH BUTTON */
.icon-btn {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--head);
  color: var(--muted);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.icon-btn.spin svg {
  animation: ring 0.6s ease-in-out infinite alternate;
  transform-origin: 50% 10%;
}

@keyframes ring {
  from {
    transform: rotate(-14deg);
  }

  to {
    transform: rotate(14deg);
  }
}

.icon-btn .dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
  border: 1.5px solid var(--head);
}

/* ADMIN PROFILE */
.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 12px;
  border-left: 1px solid var(--border);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.profile-info strong {
  font-size: 12px;
  color: var(--text);
}

.profile-info small {
  font-size: 11px;
  color: var(--muted);
}

.avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #1d2939;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 13px;
}

/* CONTENT */
.content {
  padding: 24px;
}

/* CARDS */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.muted {
  color: var(--muted);
  font-size: 13px;
}

/* STATISTICS */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-icon {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  background: var(--primary);
  opacity: 0.75;
}

.stat p {
  margin: 14px 0 6px;
}

.stat h2 {
  margin: 0 0 14px;
  font-size: 22px;
}

.stat-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pill {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.pill.up {
  background: #ecfdf3;
  color: #16a34a;
}

.pill.down {
  background: #fef3f2;
  color: #dc2626;
}

/* ROWS */
.row {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
  margin-bottom: 20px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card h4 {
  margin: 0;
  font-size: 15px;
}

.select {
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--head);
  font-size: 12px;
  color: var(--muted);
}

/* CHART LEGEND */
.legend {
  display: flex;
  gap: 18px;
  margin: 14px 0;
  font-size: 12px;
  color: var(--muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sq {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
}

/* BAR CHART */
.bar-chart {
  display: flex;
  height: 210px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 22px;
  width: 28px;
  font-size: 11px;
  color: var(--muted);
}

.bars {
  flex: 1;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(20% - 1px),
    var(--border) calc(20% - 1px),
    var(--border) 20%
  );
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.bar-track {
  flex: 1;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: #dbe4fb;
  transition: 0.2s;
}

.bar.active {
  background: var(--primary);
}

.tooltip {
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translate(-50%, -4px);
  background: #101828;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 2;
}

.x-label {
  height: 22px;
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  padding-top: 6px;
}

/* LINE CHART */
.line-chart {
  width: 100%;
  height: auto;
}

.axis {
  font-size: 10px;
  fill: var(--muted);
}

/* TABLES */
.table-card {
  padding: 20px 0 8px;
}

.table-card h4 {
  padding: 0 20px 14px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  background: var(--head);
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  padding: 10px 20px;
}

td {
  padding: 14px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.status {
  font-weight: 600;
  text-transform: capitalize;
}

.status.admin {
  color: var(--primary);
}

.status.user {
  color: #16a34a;
}

.pad {
  padding: 0 20px;
}

.error {
  color: #d92d20;
}

/* TABLE TITLE AND SEARCH */
.table-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 16px;
}

.table-card .table-title h4 {
  padding: 0;
  flex-shrink: 0;
}

.table-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  max-width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--muted);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.table-search:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.table-search input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  font-size: 12px;
}

.table-search input::placeholder {
  color: var(--muted);
}

.clear-search {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}

.clear-search:hover {
  color: var(--text);
}

.empty-result {
  padding: 25px 20px;
  text-align: center;
  color: var(--muted);
}

/* RESPONSIVE */
@media (max-width: 1100px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .sidebar {
    display: none;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .profile-info {
    display: none;
  }

  .topbar {
    padding: 14px 16px;
  }

  .topbar-left h3 {
    font-size: 15px;
  }

  .topbar-right {
    gap: 10px;
  }

  .content {
    padding: 16px;
  }
}

@media (max-width: 500px) {
  .table-title {
    align-items: stretch;
    flex-direction: column;
  }

  .table-search {
    width: 100%;
  }
}
</style>
