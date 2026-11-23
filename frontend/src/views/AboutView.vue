<script setup>
// About page: static content only
const features = [
  {
    title: 'Read stories',
    text: 'Browse posts from writers in our community, from quick thoughts to long reads.'
  },
  {
    title: 'Write your own',
    text: 'Give your idea a title, add your name, and publish it in a minute.'
  },
  {
    title: 'Keep it up to date',
    text: 'Edit or delete your posts at any time, so your stories always say what you mean.'
  }
]
</script>


<template>
  <div class="about-page">
    <!-- Page header -->
    <section class="page-head">
      <div class="container head-inner">
        <div class="head-left">
          <span class="badge">About</span>
          <h1>A place where every idea has a story.</h1>
        </div>

        <p class="head-right">
          BlogSphere is a simple space for people to write, share, and discover ideas.
        </p>
      </div>
    </section>

    <div class="container page-body">
      <!-- Mission -->
      <section class="mission">
        <h2>Why we built BlogSphere</h2>
        <p>
          Good ideas are easy to lose. BlogSphere gives them a home: a clean place to
          write them down, publish them, and let others read them. There are no
          complicated tools to learn. You open the page, write your story, and share it.
        </p>
      </section>

      <!-- What you can do -->
      <section class="features">
        <article v-for="item in features" :key="item.title" class="feature-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </section>

      <!-- Call to action -->
      <section class="cta">
        <div>
          <h2>Ready to get started?</h2>
          <p>Read what others are writing, or publish your first story.</p>
        </div>

        <div class="cta-actions">
          <router-link to="/blogs" class="btn-outline">Explore stories</router-link>
          <router-link to="/write" class="btn-primary">Write a story</router-link>
        </div>
      </section>
    </div>
  </div>
</template>


<style scoped>
.about-page {
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
  padding: 44px 0 40px;
  background: #ffffff;
  border-bottom: 1px solid #eaecf0;
}

.head-inner {
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

.page-head h1 {
  margin: 16px 0 0;
  font-size: clamp(30px, 3.4vw, 52px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -1.2px;
}

.head-right {
  margin: 0;
  padding: 24px 0 24px 44px;
  border-left: 1px solid #d0d5dd;
  color: #475467;
  font-size: 18px;
  line-height: 1.6;
}

/* ---------- Body ---------- */
.page-body {
  padding-top: 48px;
  padding-bottom: 60px;
}

.mission {
  max-width: 760px;
}

.mission h2,
.cta h2 {
  margin: 0 0 12px;
  font-size: 26px;
  font-weight: 700;
}

.mission p {
  margin: 0;
  color: #475467;
  font-size: 18px;
  line-height: 1.7;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  margin-top: 48px;
}

.feature-card {
  padding: 24px;
  background: #ffffff;
  border: 1px solid #eaecf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
}

.feature-card h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}

.feature-card p {
  margin: 0;
  color: #475467;
  font-size: 16px;
  line-height: 1.6;
}

/* ---------- Call to action ---------- */
.cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 56px;
  padding: 32px;
  background: #eff4ff;
  border-radius: 14px;
}

.cta p {
  margin: 0;
  color: #475467;
  font-size: 16px;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 26px;
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
  border-color: #1554e6;
}

/* ---------- Responsive ---------- */
@media (max-width: 1000px) {
  .features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
}

@media (max-width: 900px) {
  .head-inner {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .head-right {
    padding: 0;
    border-left: 0;
    font-size: 16px;
  }
}

@media (max-width: 700px) {
  .container {
    padding: 0 18px;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .cta {
    padding: 22px;
  }
}
</style>