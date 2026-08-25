<script setup lang="ts">
import brandMark from '~/assets/images/brand-mark.png'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="brand-logo" :class="{ compact }" aria-label="Mystikos">
    <span
      class="brand-logo-mark"
      role="img"
      aria-hidden="true"
      :style="{ WebkitMaskImage: `url(${brandMark})`, maskImage: `url(${brandMark})` }"
    />
    <span v-if="!compact" class="brand-logo-word">Mystikos</span>
  </span>
</template>
