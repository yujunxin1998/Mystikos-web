<script setup lang="ts">
import { shouldCloseProfileMenu } from '~/utils/profile-menu.mjs'
import { wishlistLoginRedirect } from '~/utils/commerce-api.mjs'

const { locale, t, toggleLocale, toggleTheme } = useMystikos()
const { authenticated, userName, userAvatarUrl, logout } = useDemoAuth()
const profileApi = useProfileApi()
const commerceApi = useCommerceApi()
const { items: wishlist, loading: wishlistLoading, summary: wishlistSummary, refresh: refreshWishlist, remove: removeWishlist, clear: clearWishlist } = useCommerceWishlist()
const route = useRoute()
const open = ref(false)
const profileMenuOpen = ref(false)
const profileTriggerRef = ref<HTMLElement | null>(null)
const profileMenuRef = ref<HTMLElement | null>(null)
const companionApproved = ref(false)
const showLogoutConfirm = ref(false)
const wishlistOpen = ref(false)
const wishlistActionId = ref<number | null>(null)
const wishlistError = ref('')
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
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
const openWishlist = async () => {
  close()
  wishlistError.value = ''
  if (!authenticated.value) { await navigateTo(wishlistLoginRedirect()); return }
  wishlistOpen.value = true
  try { await refreshWishlist() } catch (cause) { wishlistError.value = cause instanceof Error ? cause.message : '心愿单加载失败' }
}
const removeWishlistItem = async (productId: number) => {
  wishlistActionId.value = productId
  try { await removeWishlist(productId) } catch (cause) { wishlistError.value = cause instanceof Error ? cause.message : '移除心愿商品失败' }
  finally { wishlistActionId.value = null }
}
const addWishlistItemToCart = async (productId: number) => {
  wishlistActionId.value = productId
  try { await commerceApi.addToCart(productId, 1) } catch (cause) { wishlistError.value = cause instanceof Error ? cause.message : '加入购物车失败' }
  finally { wishlistActionId.value = null }
}
const goMine = async () => {
  close()
  await navigateTo(authenticated.value ? '/profile' : '/auth')
}
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
watch(authenticated, async value => {
  if (!value) { clearWishlist(); wishlistOpen.value = false; return }
  try { await refreshWishlist() } catch { /* The drawer reports errors when explicitly opened. */ }
}, { immediate: true })
watch([authenticated, () => route.query.openWishlist], async ([isAuthenticated, intent]) => {
  if (!isAuthenticated || intent !== '1') return
  await openWishlist()
  const query = { ...route.query }
  delete query.openWishlist
  await navigateTo({ path: route.path, query, hash: '' }, { replace: true })
}, { immediate: true })
const confirmLogout = async () => {
  await logout()
  showLogoutConfirm.value = false
  close()
  closeProfileMenu()
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
        <NuxtLink to="/companions" @click="close">{{ t('nav.companions') }}</NuxtLink>
        <NuxtLink to="/shop" @click="close">{{ t('nav.shop') }}</NuxtLink>
        <NuxtLink v-if="authenticated" to="/profile" @click="close">{{ t('nav.mine') }}</NuxtLink>
        <button v-else type="button" class="nav-text-button" @click="goMine">{{ t('nav.mine') }}</button>
      </nav>
      <div class="header-actions">
        <button class="header-icon-btn wishlist-count" type="button" :aria-label="t('nav.wishlist')" @click="openWishlist">
          <svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M12 20.4s-6.8-4.2-9.1-8.1C1.3 9.7 2.1 6.4 5 5.3c1.8-.7 3.8-.1 4.9 1.4L12 9l2.1-2.3c1.1-1.5 3.1-2.1 4.9-1.4 2.9 1.1 3.7 4.4 2.1 7-2.3 3.9-9.1 8.1-9.1 8.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
          <span v-if="wishlistSummary.count > 0" class="wishlist-badge">{{ wishlistSummary.count > 99 ? '99+' : wishlistSummary.count }}</span>
        </button>
        <NuxtLink v-if="authenticated" to="/bookings/cart" class="header-icon-btn booking-cart-link" :aria-label="t('nav.bookingCart')" :title="t('nav.bookingCart')" @click="close">
          <svg class="header-icon header-icon--cart" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M3.2 5.2h2.1l1.55 11.2a1.9 1.9 0 0 0 1.88 1.65h9.55a1.9 1.9 0 0 0 1.87-1.55L21.2 8.1H7.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10.1" cy="20.35" r="1.35" fill="currentColor"/>
            <circle cx="17.3" cy="20.35" r="1.35" fill="currentColor"/>
          </svg>
        </NuxtLink>
        <div v-if="authenticated" class="profile-menu">
          <button ref="profileTriggerRef" class="profile-chip" type="button" :title="t('profile.title')" :aria-expanded="profileMenuOpen" aria-haspopup="menu" @click="profileMenuOpen = !profileMenuOpen"><img v-if="userAvatarUrl && !avatarFailed" :src="userAvatarUrl" alt="" @error="avatarFailed = true"><span v-else>{{ headerInitial }}</span></button>
          <div v-if="profileMenuOpen" ref="profileMenuRef" class="profile-menu-popover" role="menu">
            <div class="profile-menu-heading"><span>{{ userName || 'Stargazer' }}</span><small>{{ companionApproved ? 'COMPANION' : 'MEMBER' }}</small></div>
            <NuxtLink to="/profile" role="menuitem" @click="closeProfileMenu"><span>{{ t('nav.profileHome') }}</span><small>{{ t('nav.profileHomeHint') }}</small></NuxtLink>
            <NuxtLink v-if="companionApproved" to="/companion/card" role="menuitem" @click="closeProfileMenu"><span>{{ t('nav.companionCard') }}</span><small>{{ t('nav.companionCardHint') }}</small></NuxtLink>
            <button type="button" role="menuitem" class="profile-menu-action" @click="toggleTheme(); closeProfileMenu()"><span>{{ t('nav.theme') }}</span><small>{{ t('nav.themeHint') }}</small></button>
            <button type="button" role="menuitem" class="profile-menu-action" @click="toggleLocale(); closeProfileMenu()"><span>{{ t('nav.language') }}</span><small>{{ t('nav.languageHint') }}</small></button>
            <button type="button" role="menuitem" class="profile-menu-action danger" @click="closeProfileMenu(); showLogoutConfirm = true"><span>{{ t('auth.logout') }}</span><small>{{ t('nav.logoutHint') }}</small></button>
          </div>
        </div>
        <NuxtLink v-else to="/auth" class="auth-link" @click="close">{{ t('auth.login') }}</NuxtLink>
      </div>
    </div>
  </header>

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="wishlistOpen" class="commerce-drawer-backdrop" @click.self="wishlistOpen = false">
        <aside class="commerce-drawer wishlist-drawer" aria-label="心愿单汇总">
          <header><div><p class="eyebrow"><span />{{ t('nav.wishlistEyebrow') }}</p><h2>{{ t('nav.wishlist') }}</h2><p>{{ t('nav.wishlistCount', { count: wishlistSummary.count }) }}</p></div><button class="modal-close" :aria-label="t('modal.close')" @click="wishlistOpen = false">×</button></header>
          <p v-if="wishlistError" class="commerce-alert" role="alert">{{ wishlistError }}</p>
          <p v-if="wishlistLoading && !wishlist.length" class="empty-state">{{ t('nav.wishlistLoading') }}</p>
          <div v-else-if="wishlist.length" class="wishlist-lines">
            <article v-for="line in wishlist" :key="line.productId">
              <div><h3>{{ line.productName }}</h3><p>{{ t('nav.wishlistAdded', { date: new Date(line.addedAt).toLocaleDateString() }) }}</p></div><strong>{{ money(line.unitPrice) }}</strong>
              <div class="wishlist-line-actions"><button :disabled="wishlistActionId === line.productId" @click="removeWishlistItem(line.productId)">{{ t('modal.remove') }}</button><button :disabled="wishlistActionId === line.productId" @click="addWishlistItemToCart(line.productId)">{{ t('nav.wishlistToCart') }}</button></div>
            </article>
          </div>
          <p v-else class="empty-state">{{ t('nav.wishlistEmpty') }}</p>
          <footer v-if="wishlist.length"><p><span>{{ t('nav.wishlistCount', { count: wishlistSummary.count }) }}</span><strong>{{ money(wishlistSummary.total) }}</strong></p><button class="button button-primary" @click="wishlistOpen = false; navigateTo('/shop')">{{ t('nav.wishlistContinue') }}</button></footer>
        </aside>
      </div>
    </Transition>
  </Teleport>

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
