
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { compressImage } from '../utils/image'

// Backend API URL
const API_URL = '/api/blogs'
const router = useRouter()

// Create Blog Form Data
const newBlog = ref({
  title: '',
  content: '',
  author: '',
  image: ''
})

// Create Form States
const submitting = ref(false)
const formError = ref('')

// Image upload
const fileInput = ref(null)
const imageError = ref('')
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

const onImageChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  imageError.value = ''

  if (file.size > MAX_IMAGE_SIZE) {
    imageError.value =
      'This image is too large. Please choose one under 5 MB.'
    event.target.value = ''
    return
  }

  try {
    newBlog.value.image = await compressImage(file)
  } catch (err) {
    imageError.value = err.message
  }
}

const removeImage = () => {
  newBlog.value.image = ''
  imageError.value = ''

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Create New Blog
const createBlog = async () => {
  submitting.value = true
  formError.value = ''

  try {
    // Get JWT Token from Local Storage
    const token = localStorage.getItem('token')

    // Check Login
    if (!token) {
      throw new Error('Please login before publishing a blog.')
    }

    // Send POST Request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newBlog.value)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create blog')
    }

    // Go to Blog List
    router.push('/blogs')

  } catch (err) {
    formError.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="write-page">

    <!-- Page header -->
    <section class="page-head">
      <div class="container">
        <span class="badge">Write</span>
        <h1>Write a Story</h1>
        <p>
          Share your ideas, experiences, and inspiration with the community.
        </p>
      </div>
    </section>

    <!-- Form -->
    <div class="container page-body">
      <section class="form-card">

        <form @submit.prevent="createBlog">

          <div class="form-row">

            <div class="form-group">
              <label for="blog-title">Blog Title</label>

              <input
                id="blog-title"
                v-model="newBlog.title"
                type="text"
                placeholder="Enter your blog title"
                required
              />
            </div>

            <div class="form-group">
              <label for="blog-author">Author</label>

              <input
                id="blog-author"
                v-model="newBlog.author"
                type="text"
                placeholder="Enter author name"
                required
              />
            </div>

          </div>

          <!-- Cover Image -->
          <div class="form-group">

            <label>
              Cover Image
              <span class="optional">(optional)</span>
            </label>

            <div v-if="newBlog.image" class="image-preview">

              <img
                :src="newBlog.image"
                alt="Cover preview"
              />

              <div class="image-actions">
                <button
                  type="button"
                  class="remove-image"
                  @click="removeImage"
                >
                  Remove
                </button>
              </div>

            </div>

            <label
              v-else
              class="upload-box"
              for="blog-image"
            >
              <span class="upload-title">
                Click to upload an image
              </span>

              <span class="upload-hint">
                PNG, JPG or WEBP, up to 5 MB
              </span>
            </label>

            <input
              id="blog-image"
              ref="fileInput"
              type="file"
              accept="image/*"
              class="file-input"
              @change="onImageChange"
            />

            <p v-if="imageError" class="message error">
              {{ imageError }}
            </p>

          </div>

          <!-- Content -->
          <div class="form-group">

            <label for="blog-content">Content</label>

            <textarea
              id="blog-content"
              v-model="newBlog.content"
              rows="10"
              placeholder="Write your story..."
              required
            ></textarea>

          </div>

          <!-- Error Message -->
          <p v-if="formError" class="message error">
            {{ formError }}
          </p>

          <!-- Form Actions -->
          <div class="form-actions">

            <button
              class="primary-button"
              type="submit"
              :disabled="submitting"
            >
              {{ submitting ? 'Publishing...' : 'Publish Blog' }}
            </button>

            <router-link
              to="/blogs"
              class="secondary-button"
            >
              Cancel
            </router-link>

          </div>

        </form>

      </section>
    </div>

  </div>
</template>

<style scoped>
.write-page {
  width: 100%;
  color: #101828;
}

.container {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 52px;
}

/* ---------- Page header ---------- */
.page-head {
  padding: 44px 0 32px;
  background: #ffffff;
  border-bottom: 1px solid #eaecf0;
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

.page-head h1 {
  margin: 16px 0 10px;
  font-size: clamp(30px, 3.4vw, 48px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -1.2px;
}

.page-head p {
  margin: 0;
  color: #475467;
  font-size: 18px;
  line-height: 1.6;
}

/* ---------- Form ---------- */
.page-body {
  padding-top: 38px;
  padding-bottom: 60px;
}

.form-card {
  max-width: 820px;
  padding: 28px;
  background: #ffffff;
  border: 1px solid #eaecf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

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

.form-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  padding: 11px 24px;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.primary-button {
  background: #1554e6;
  color: #ffffff;
}

.primary-button:hover {
  background: #1145c2;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  background: #f2f4f7;
  color: #344054;
}

.secondary-button:hover {
  background: #e4e7ec;
}

.message {
  margin: 12px 0;
  font-size: 14px;
}

.error {
  color: #d92d20;
}

/* ---------- Responsive ---------- */
@media (max-width: 700px) {
  .container {
    padding: 0 18px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-card {
    padding: 20px;
  }

  .page-head p {
    font-size: 16px;
  }
}
</style>
