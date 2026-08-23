<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="brand-logo" :class="{ compact }" aria-label="Mystikos">
    <svg class="brand-logo-mark" viewBox="0 0 72 88" role="img" aria-hidden="true">
      <rect x="7" y="5" width="58" height="78" rx="29" fill="none" stroke="currentColor" stroke-width="2.5" />
      <rect x="11.5" y="9.5" width="49" height="69" rx="24.5" fill="none" stroke="currentColor" stroke-width="1.15" opacity=".7" />
      <path d="M20 58.5V29.5l16 17 16-17v29" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M20 29.5l16 17" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" opacity=".62" />
    </svg>
    <span v-if="!compact" class="brand-logo-word">Mystikos</span>
  </span>
</template>
