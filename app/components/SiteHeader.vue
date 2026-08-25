<script setup lang="ts">
import { shouldCloseProfileMenu } from '~/utils/profile-menu.mjs'

const { locale, t, toggleLocale, toggleTheme, wishlist } = useMystikos()
const { authenticated, userName, userAvatarUrl, logout } = useDemoAuth()
const profileApi = useProfileApi()
const open = ref(false)
const profileMenuOpen = ref(false)
const profileTriggerRef = ref<HTMLElement | null>(null)
const profileMenuRef = ref<HTMLElement | null>(null)
const companionApproved = ref(false)
const showLogoutConfirm = ref(false)
const close = () => { open.value = false }
const closeProfileMenu = () => { profileMenuOpen.value = false }
const handleDocumentPointerDown = (event: PointerEvent) => {
  if (profileMenuOpen.value && shouldCloseProfileMenu(event.target, profileTriggerRef.value, profileMenuRef.value)) closeProfileMenu()
}
const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeProfileMenu()
}
const handleDocumentScroll = () => { closeProfileMenu() }
const avatarFailed = ref(false)
const headerInitial = computed(() => userName.value.trim() ? userName.value.trim().slice(0, 1).toLocaleUpperCase() : '✦')
watch(userAvatarUrl, () => { avatarFailed.value = false })
onMounted(async () => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  document.addEventListener('keydown', handleDocumentKeydown)
  document.addEventListener('scroll', handleDocumentScroll, { passive: true })
  if (!authenticated.value) return
  try {
    const profile = await profileApi.getProfile()
    userName.value = profile.nickname || userName.value
    userAvatarUrl.value = profile.avatarUrl || ''
    companionApproved.value = profile.roles?.includes('COMPANION') ?? false
    avatarFailed.value = false
  } catch { /* Header remains usable with the initials fallback. */ }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  document.removeEventListener('scroll', handleDocumentScroll)
})
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
        <NuxtLink to="/companions" @click="close">{{ t('nav.companions') }}</NuxtLink>
        <NuxtLink to="/shop" @click="close">{{ t('nav.shop') }}</NuxtLink>
        <NuxtLink to="/#membership" @click="close">{{ t('nav.membership') }}</NuxtLink>
      </nav>
      <div class="header-actions">
        <NuxtLink to="/shop#wishlist" class="wishlist-count" aria-label="Wishlist">♡ <span>{{ wishlist.length }}</span></NuxtLink>
        <div v-if="authenticated" class="profile-menu">
          <button ref="profileTriggerRef" class="profile-chip" type="button" :title="t('profile.title')" :aria-expanded="profileMenuOpen" aria-haspopup="menu" @click="profileMenuOpen = !profileMenuOpen"><img v-if="userAvatarUrl && !avatarFailed" :src="userAvatarUrl" alt="" @error="avatarFailed = true"><span v-else>{{ headerInitial }}</span></button>
          <div v-if="profileMenuOpen" ref="profileMenuRef" class="profile-menu-popover" role="menu">
            <div class="profile-menu-heading"><span>{{ userName || 'Stargazer' }}</span><small>{{ companionApproved ? 'COMPANION' : 'MEMBER' }}</small></div>
            <NuxtLink to="/profile" role="menuitem" @click="closeProfileMenu"><span>{{ t('nav.profileHome') }}</span><small>{{ t('nav.profileHomeHint') }}</small></NuxtLink>
            <NuxtLink v-if="companionApproved" to="/companion/card" role="menuitem" @click="closeProfileMenu"><span>{{ t('nav.companionCard') }}</span><small>{{ t('nav.companionCardHint') }}</small></NuxtLink>
          </div>
        </div>
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
