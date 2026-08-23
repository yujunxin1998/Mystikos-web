<script setup lang="ts">
const { locale, t, toggleLocale, toggleTheme, wishlist } = useMystikos()
const { authenticated, userName, logout } = useDemoAuth()
const open = ref(false)
const showLogoutConfirm = ref(false)
const close = () => { open.value = false }
const confirmLogout = async () => {
  await logout()
  showLogoutConfirm.value = false
  close()
  await navigateTo('/')
}
</script>

<template>
  <header class="site-header">
    <NuxtLink to="/" class="brand" aria-label="Mystikos home" @click="close">
      <BrandLogo />
    </NuxtLink>

    <button class="menu-toggle" :aria-label="open ? t('nav.close') : t('nav.menu')" :aria-expanded="open" @click="open = !open">
      <span /><span /><span />
    </button>

    <div class="nav-wrap" :class="{ 'is-open': open }">
      <nav aria-label="Primary navigation">
        <NuxtLink to="/" @click="close">{{ t('nav.home') }}</NuxtLink>
        <NuxtLink to="/shop" @click="close">{{ t('nav.shop') }}</NuxtLink>
        <NuxtLink to="/#membership" @click="close">{{ t('nav.membership') }}</NuxtLink>
      </nav>
      <div class="header-actions">
        <NuxtLink to="/shop#wishlist" class="wishlist-count" aria-label="Wishlist">♡ <span>{{ wishlist.length }}</span></NuxtLink>
        <NuxtLink v-if="authenticated" to="/profile" class="profile-chip" :title="t('profile.title')" @click="close">{{ userName.slice(0, 1).toUpperCase() }}</NuxtLink>
        <button v-if="authenticated" class="logout-trigger" :title="t('auth.logout')" @click="showLogoutConfirm = true">{{ t('auth.logout') }}</button>
        <NuxtLink v-else to="/auth" class="auth-link" @click="close">{{ t('auth.login') }}</NuxtLink>
        <button class="icon-button" :aria-label="t('nav.theme')" @click="toggleTheme"><span aria-hidden="true">◐</span></button>
        <button class="language-button" @click="toggleLocale">{{ locale === 'en' ? '中' : 'EN' }}</button>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <div v-if="showLogoutConfirm" class="confirm-overlay" role="presentation" @click.self="showLogoutConfirm = false">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="t('auth.logoutConfirmTitle')">
        <p class="eyebrow"><span />MYSTIKOS</p>
        <h2>{{ t('auth.logoutConfirmTitle') }}</h2>
        <p>{{ t('auth.logoutConfirmBody') }}</p>
        <div class="confirm-actions"><button class="button button-ghost" @click="showLogoutConfirm = false">{{ t('auth.cancel') }}</button><button class="button button-primary" @click="confirmLogout">{{ t('auth.confirmLogout') }}</button></div>
      </section>
    </div>
  </Teleport>
</template>
