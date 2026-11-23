
<template>
  <section class="home">
    <h1>Welcome to BlogSphere</h1>

    <p>
      Discover interesting articles, share your ideas,
      and explore knowledge with BlogSphere.
    </p>

    <router-link to="/blogs" class="button">
      Explore Blogs
    </router-link>
  </section>
</template>

<style scoped>
.home {
  text-align: center;
  padding: 80px 20px;
}

h1 {
  font-size: 40px;
  color: #1e293b;
}

p {
  color: #64748b;
  font-size: 18px;
  margin-bottom: 30px;
}

.button {
  display: inline-block;
  padding: 12px 24px;
  background: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 8px;
}
</style>
