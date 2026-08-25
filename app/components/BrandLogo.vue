<script setup lang="ts">
import wordmark from '~/assets/images/auth-mystikos-wordmark.png'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="brand-logo" :class="{ compact }" aria-label="Mystikos">
    <img :src="wordmark" alt="Mystikos">
  </span>
</template>
