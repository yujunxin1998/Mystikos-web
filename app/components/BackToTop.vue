<script setup lang="ts">
import { shouldShowBackToTop } from '~/utils/scroll-navigation.mjs'

const visible = ref(false)
const updateVisibility = () => { visible.value = shouldShowBackToTop(window.scrollY) }
const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }) }

onMounted(() => {
  updateVisibility()
  window.addEventListener('scroll', updateVisibility, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('scroll', updateVisibility))
</script>

<template>
  <Transition name="back-to-top">
    <button v-if="visible" class="back-to-top" type="button" aria-label="Back to top" @click="scrollToTop">
      <span aria-hidden="true">↑</span><small>TOP</small>
    </button>
  </Transition>
</template>
