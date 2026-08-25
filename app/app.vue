<script setup lang="ts">
const { locale, theme, applyTheme } = useMystikos()
const route = useRoute()
const isAuthRoute = computed(() => route.path === '/auth')

useHead({
  htmlAttrs: {
    lang: computed(() => (locale.value === 'zh' ? 'zh-CN' : 'en')),
    'data-theme': theme
  }
})

onMounted(applyTheme)
</script>

<template>
  <div class="site-shell" :class="{ 'is-auth-route': isAuthRoute }" :data-theme="theme">
    <SiteHeader v-if="!isAuthRoute" />
    <main :class="{ 'auth-route-main': isAuthRoute }">
      <NuxtPage />
    </main>
    <SiteFooter v-if="!isAuthRoute" />
  </div>
</template>
