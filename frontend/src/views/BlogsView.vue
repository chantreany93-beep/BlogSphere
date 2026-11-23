
<script setup>
import { ref, onMounted } from 'vue'
import { compressImage } from '../utils/image'

// Backend API URL
const API_URL = '/api/blogs'

// Get Authentication Token from localStorage
const getToken = () => {
  return localStorage.getItem('token')
}

// Authorization Headers
const getAuthHeaders = () => {
  const token = getToken()

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

// Store blogs from MongoDB
const blogs = ref([])

// Loading and error states
const loading = ref(true)
const error = ref('')

// Edit Blog Data
const editingBlogId = ref(null)

const editBlogData = ref({
  title: '',
  content: '',
  author: '',
  image: ''
})

const updating = ref(false)
const editError = ref('')
const editSuccessMessage = ref('')

// Delete Blog States
const deletingBlogId = ref(null)
const deleteError = ref('')

// Get blogs from Backend API
const fetchBlogs = async () => {
  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error('Failed to fetch blogs')
    }

    const result = await response.json()
    blogs.value = result.data

  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Start Editing Blog
const startEditing = (blog) => {
  editingBlogId.value = blog._id

  editBlogData.value = {
    title: blog.title,
    content: blog.content,
    author: blog.author,
    image: blog.image || ''
  }

  editError.value = ''
  editSuccessMessage.value = ''
}

// Cancel Editing
const cancelEditing = () => {
  editingBlogId.value = null

  editBlogData.value = {
    title: '',
    content: '',
    author: '',
    image: ''
  }

  editError.value = ''
}

// Update Blog
const updateBlog = async (id) => {
  updating.value = true
  editError.value = ''
  editSuccessMessage.value = ''

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(editBlogData.value)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update blog')
    }

    blogs.value = blogs.value.map((blog) =>
      blog._id === id ? result.data : blog
    )

    editingBlogId.value = null
    editSuccessMessage.value = 'Blog updated successfully!'

  } catch (err) {
    editError.value = err.message
  } finally {
    updating.value = false
  }
}

// Delete Blog
const deleteBlog = async (id) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this blog?'
  )

  if (!confirmed) return

  deletingBlogId.value = id
  deleteError.value = ''

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete blog')
    }

    blogs.value = blogs.value.filter(
      (blog) => blog._id !== id
    )

  } catch (err) {
    deleteError.value = err.message
  } finally {
    deletingBlogId.value = null
  }
}

// Choose a new cover image while editing
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

const onEditImageChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  editError.value = ''

  if (file.size > MAX_IMAGE_SIZE) {
    editError.value = 'This image is too large. Please choose one under 5 MB.'
    event.target.value = ''
    return
  }

  try {
    editBlogData.value.image = await compressImage(file)
  } catch (err) {
    editError.value = err.message
  }
}

// Format Blog Date
const formatDate = (date) => {
  if (!date) return ''

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Run when component loads
onMounted(() => {
  fetchBlogs()
})
</script>

<template>
  <div class="blog-page">
    <!-- Hero -->
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-left">
          <span class="badge">Blog</span>

          <h1>
            The Journal: Design Resources, Interviews, and Industry News
          </h1>

          <div class="hero-actions">
            <a href="#posts" class="btn-primary">
              Read stories
            </a>

            <router-link to="/write" class="btn-outline">
              Write a story
            </router-link>
          </div>
        </div>

        <p class="hero-right">
          Discover stories, ideas, and inspiration from our community.
        </p>
      </div>
    </section>

    <div class="container page-body">
      <!-- Blog List -->
      <section id="posts" class="posts-section">
        <div class="posts-heading">
          <h2>Recent Blog Posts</h2>
          <span class="post-count">
            {{ blogs.length }} Posts
          </span>
        </div>

        <p v-if="editSuccessMessage" class="message success">
          {{ editSuccessMessage }}
        </p>

        <div v-if="loading" class="state-message">
          Loading blogs...
        </div>

        <div v-else-if="error" class="message error">
          {{ error }}
        </div>

        <div v-else-if="blogs.length === 0" class="empty-state">
          <h3>No blogs yet</h3>
          <p>Be the first to share your story with the community.</p>
        </div>

        <div v-else class="blog-list">
          <article
            v-for="(blog, index) in blogs"
            :key="blog._id"
            class="blog-card"
          >
            <!-- Edit mode -->
            <template v-if="editingBlogId === blog._id">
              <div class="card-body">
                <h3>Edit Blog</h3>

                <form @submit.prevent="updateBlog(blog._id)">
                  <div class="form-group">
                    <label>Blog Title</label>
                    <input
                      v-model="editBlogData.title"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label>Author</label>
                    <input
                      v-model="editBlogData.author"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label>Cover Image</label>

                    <div
                      v-if="editBlogData.image"
                      class="image-preview"
                    >
                      <img
                        :src="editBlogData.image"
                        alt="Cover preview"
                      />

                      <div class="image-actions">
                        <label
                          class="change-image"
                          :for="'edit-image-' + blog._id"
                        >
                          Change
                        </label>

                        <button
                          type="button"
                          class="remove-image"
                          @click="editBlogData.image = ''"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <label
                      v-else
                      class="upload-box"
                      :for="'edit-image-' + blog._id"
                    >
                      <span class="upload-title">
                        Click to upload an image
                      </span>

                      <span class="upload-hint">
                        PNG, JPG or WEBP, up to 5 MB
                      </span>
                    </label>

                    <input
                      :id="'edit-image-' + blog._id"
                      type="file"
                      accept="image/*"
                      class="file-input"
                      @change="onEditImageChange"
                    />
                  </div>

                  <div class="form-group">
                    <label>Content</label>

                    <textarea
                      v-model="editBlogData.content"
                      rows="5"
                      required
                    ></textarea>
                  </div>

                  <p v-if="editError" class="message error">
                    {{ editError }}
                  </p>

                  <div class="card-actions">
                    <button
                      type="submit"
                      class="primary-button"
                      :disabled="updating"
                    >
                      {{ updating ? 'Saving...' : 'Save Changes' }}
                    </button>

                    <button
                      type="button"
                      class="secondary-button"
                      @click="cancelEditing"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </template>

            <!-- View mode -->
            <template v-else>
              <!-- Cover Image -->
              <img
                v-if="blog.image"
                :src="blog.image"
                loading="lazy"
                class="card-cover"
                alt=""
              />

              <div
                v-else
                class="card-cover cover-placeholder"
                :class="'cover-' + (index % 3)"
              >
                <span>
                  {{ blog.title.charAt(0).toUpperCase() }}
                </span>
              </div>

              <div class="card-body">
                <div class="meta">
                  <span class="author-avatar">
                    {{ blog.author.charAt(0).toUpperCase() }}
                  </span>

                  <span class="meta-text">
                    {{ blog.author }} · {{ formatDate(blog.createdAt) }}
                  </span>
                </div>

                <h3>{{ blog.title }}</h3>

                <p class="blog-content">
                  {{ blog.content }}
                </p>

                <!-- Tags -->
                <div
                  v-if="blog.tags && blog.tags.length"
                  class="tags"
                >
                  <span
                    v-for="tag in blog.tags"
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>

                <div class="card-bottom">
                  <div class="card-actions">
                    <button
                      class="edit-button"
                      @click="startEditing(blog)"
                    >
                      Edit
                    </button>

                    <button
                      class="delete-button"
                      :disabled="deletingBlogId === blog._id"
                      @click="deleteBlog(blog._id)"
                    >
                      {{
                        deletingBlogId === blog._id
                          ? 'Deleting...'
                          : 'Delete'
                      }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <p
              v-if="deleteError"
              class="message error card-message"
            >
              {{ deleteError }}
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.blog-page {
  width: 100%;
  color: #101828;
}

.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 52px;
}

/* ---------- Hero ---------- */
.hero {
  background: #ffffff;
  color: #101828;
  padding: 44px 0 36px;
  border-bottom: 1px solid #eaecf0;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 40px;
  align-items: center;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  background: #eff4ff;
  color: #1554e6;
  font-size: 15px;
  font-weight: 600;
}

.hero h1 {
  margin: 16px 0 26px;
  font-size: clamp(30px, 3.4vw, 52px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -1.2px;
}

.hero-right {
  margin: 0;
  padding: 26px 0 26px 48px;
  border-left: 1px solid #d0d5dd;
  color: #475467;
  font-size: 18px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: 999px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 700;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-primary {
  background: #1554e6;
  color: #ffffff;
  border: 1px solid #1554e6;
}

.btn-primary:hover {
  background: #1145c2;
  border-color: #1145c2;
}

.btn-outline {
  background: #ffffff;
  color: #1554e6;
  border: 1px solid #d0d5dd;
}

.btn-outline:hover {
  background: #eff4ff;
  border-color: #1554e6;
}

/* ---------- Page body ---------- */
.page-body {
  padding-top: 38px;
  padding-bottom: 60px;
}

.posts-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.posts-heading h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.post-count {
  padding: 6px 14px;
  border-radius: 999px;
  background: #eff4ff;
  color: #1554e6;
  font-size: 13px;
  font-weight: 600;
}

/* ---------- Blog cards ---------- */
.blog-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
}

.blog-card {
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #eaecf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
  display: flex;
  flex-direction: column;
}

.card-cover {
  width: 100%;
  height: 210px;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  display: grid;
  place-items: center;
}

.cover-placeholder span {
  font-size: 72px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.cover-0 {
  background: linear-gradient(135deg, #8db4ff 0%, #1554e6 100%);
}

.cover-1 {
  background: linear-gradient(135deg, #c7d7fe 0%, #4f7cf0 100%);
}

.cover-2 {
  background: linear-gradient(135deg, #b2ccff 0%, #0f3fb8 100%);
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  color: #475467;
  font-size: 14px;
}

.meta-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background: #dbeafe;
  color: #1554e6;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 700;
}

.blog-card h3 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.blog-content {
  margin: 0;
  color: #475467;
  font-size: 16px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tag {
  padding: 3px 12px;
  border-radius: 999px;
  background: #eff4ff;
  color: #1554e6;
  font-size: 14px;
  font-weight: 500;
}

.card-bottom {
  margin-top: auto;
  padding-top: 18px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-message {
  padding: 0 20px 16px;
  margin: 0;
}

/* ---------- Edit form ---------- */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #344054;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  outline: none;
  font: inherit;
  font-size: 15px;
  color: #101828;
  background: #ffffff;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #1554e6;
  box-shadow: 0 0 0 4px #dbe6fd;
}

.form-group textarea {
  resize: vertical;
}

.form-group input.file-input {
  display: none;
}

.form-group .upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 28px 16px;
  border: 2px dashed #d0d5dd;
  border-radius: 12px;
  background: #f9fafb;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.form-group .upload-box:hover {
  border-color: #1554e6;
  background: #eff4ff;
}

.upload-title {
  color: #1554e6;
  font-size: 15px;
  font-weight: 600;
}

.upload-hint {
  color: #667085;
  font-size: 13px;
  font-weight: 400;
}

.optional {
  color: #667085;
  font-weight: 400;
}

.image-preview {
  position: relative;
  overflow: hidden;
  border: 1px solid #eaecf0;
  border-radius: 12px;
}

.image-preview img {
  display: block;
  width: 100%;
  max-height: 260px;
  object-fit: cover;
}

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.form-group .change-image,
.remove-image {
  padding: 7px 14px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  color: #344054;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.25);
}

.remove-image {
  color: #d92d20;
}

/* ---------- Buttons ---------- */
.primary-button,
.secondary-button,
.edit-button,
.delete-button {
  border: 0;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
}

.primary-button {
  background: #1554e6;
  color: #ffffff;
}

.primary-button:hover {
  background: #1145c2;
}

.primary-button:disabled,
.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-button {
  background: #eff4ff;
  color: #1554e6;
}

.edit-button:hover {
  background: #dbe6fd;
}

.delete-button {
  background: #fef3f2;
  color: #d92d20;
}

.delete-button:hover {
  background: #fee4e2;
}

.secondary-button {
  background: #f2f4f7;
  color: #344054;
}

/* ---------- Messages ---------- */
.message {
  margin: 12px 0;
  font-size: 14px;
}

.success {
  color: #067647;
}

.error {
  color: #d92d20;
}

.state-message,
.empty-state {
  padding: 48px 20px;
  text-align: center;
  color: #475467;
  background: #ffffff;
  border: 1px dashed #d0d5dd;
  border-radius: 14px;
}

.empty-state h3 {
  margin: 0 0 6px;
  color: #101828;
}

.empty-state p {
  margin: 0;
}

/* ---------- Responsive ---------- */
@media (max-width: 1000px) {
  .blog-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
}

@media (max-width: 900px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .hero-right {
    padding: 0;
    border-left: 0;
    font-size: 16px;
  }
}

@media (max-width: 700px) {
  .container {
    padding: 0 18px;
  }

  .blog-list {
    grid-template-columns: 1fr;
  }
}
</style>
