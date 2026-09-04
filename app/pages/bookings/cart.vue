<script setup lang="ts">
import { bookingCartLoginRedirect } from '~/utils/booking-api.mjs'

const { authenticated } = useDemoAuth()

onMounted(async () => {
  if (!authenticated.value) {
    await navigateTo(bookingCartLoginRedirect())
    return
  }
  await navigateTo('/companions?openBookingCart=1')
})
</script>

<template>
  <section class="commerce-order-page section-wrap">
    <p class="empty-state">正在打开点单车…</p>
  </section>
</template>
