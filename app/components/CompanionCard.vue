<script setup lang="ts">
defineProps<{
  companion: { name: string; role: string; game: string; rating: string; rate: string; image: string; color: string }
}>()
const { t } = useMystikos()
</script>

<template>
  <article class="companion-card">
    <div class="companion-image-wrap">
      <img :src="companion.image" :alt="`${companion.name}, ${companion.role}`" class="companion-image" loading="lazy">
      <span class="online-dot" aria-label="Online" />
      <div class="card-wash" :style="{ '--accent': companion.color }" />
    </div>
    <div class="companion-content">
      <div class="companion-title"><div><h3>{{ companion.name }}</h3><p>{{ companion.role }}</p></div><span class="rating">★ {{ companion.rating }}</span></div>
      <p class="companion-game">{{ companion.game }}</p>
      <div class="companion-bottom"><strong>{{ companion.rate }}</strong><NuxtLink to="/companions" class="companion-book-btn">{{ t('companions.book') }}</NuxtLink></div>
    </div>
  </article>
</template>
