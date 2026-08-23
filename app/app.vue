<script setup lang="ts">
const { theme, applyTheme } = useMystikos()
const route = useRoute()
const isAuthRoute = computed(() => route.path === '/auth')

useHead({
  htmlAttrs: { lang: 'en', 'data-theme': theme }
})

onMounted(applyTheme)
</script>

<template>
  <div class="site-shell" :data-theme="theme">
    <SiteHeader v-if="!isAuthRoute" />
    <main>
      <NuxtPage />
    </main>
    <SiteFooter v-if="!isAuthRoute" />
  </div>
</template>
