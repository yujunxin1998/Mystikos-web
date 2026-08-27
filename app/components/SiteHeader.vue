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
        <button class="wishlist-count" type="button" aria-label="查看心愿单" @click="openWishlist">♡ <span>{{ wishlistSummary.count }}</span></button>
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
    <Transition name="fade">
      <div v-if="wishlistOpen" class="commerce-drawer-backdrop" @click.self="wishlistOpen = false">
        <aside class="commerce-drawer wishlist-drawer" aria-label="心愿单汇总">
          <header><div><p class="eyebrow"><span />WISHLIST</p><h2>心愿单</h2><p>{{ wishlistSummary.count }} 件收藏</p></div><button class="modal-close" aria-label="关闭心愿单" @click="wishlistOpen = false">×</button></header>
          <p v-if="wishlistError" class="commerce-alert" role="alert">{{ wishlistError }}</p>
          <p v-if="wishlistLoading && !wishlist.length" class="empty-state">正在读取心愿单…</p>
          <div v-else-if="wishlist.length" class="wishlist-lines">
            <article v-for="line in wishlist" :key="line.productId">
              <div><h3>{{ line.productName }}</h3><p>收藏于 {{ new Date(line.addedAt).toLocaleDateString() }}</p></div><strong>{{ money(line.unitPrice) }}</strong>
              <div class="wishlist-line-actions"><button :disabled="wishlistActionId === line.productId" @click="removeWishlistItem(line.productId)">移除</button><button :disabled="wishlistActionId === line.productId" @click="addWishlistItemToCart(line.productId)">加入购物车</button></div>
            </article>
          </div>
          <p v-else class="empty-state">还没有收藏商品。</p>
          <footer v-if="wishlist.length"><p><span>共 {{ wishlistSummary.count }} 件</span><strong>{{ money(wishlistSummary.total) }}</strong></p><button class="button button-primary" @click="wishlistOpen = false; navigateTo('/shop')">继续逛商城</button></footer>
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
