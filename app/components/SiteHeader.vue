<script setup lang="ts">
import { shouldCloseProfileMenu } from '~/utils/profile-menu.mjs'
import { bookingCartLoginRedirect } from '~/utils/booking-api.mjs'
import { cartLoginRedirect, openCommerceCheckout, wishlistLoginRedirect } from '~/utils/commerce-api.mjs'
import { acquireScrollLock, releaseScrollLock } from '~/utils/scroll-lock.mjs'

const { locale, theme, t, toggleLocale, toggleTheme } = useMystikos()
const { authenticated, userName, userAvatarUrl, logout } = useDemoAuth()
const profileApi = useProfileApi()
const commerceApi = useCommerceApi()
const { items: wishlist, loading: wishlistLoading, summary: wishlistSummary, refresh: refreshWishlist, remove: removeWishlist, clear: clearWishlist } = useCommerceWishlist()
const {
  items: cart,
  loading: cartLoading,
  drawerOpen: cartOpen,
  selectedIdSet: cartSelectedIdSet,
  selectedLines: cartSelectedLines,
  selectedTotal: cartSelectedTotal,
  allSelected: cartAllSelected,
  count: cartCount,
  refresh: refreshCart,
  remove: removeCartLine,
  toggleLine: toggleCartLine,
  toggleSelectAll: toggleCartSelectAll,
  clear: clearCart,
  openDrawer: openCartDrawer,
  closeDrawer: closeCartDrawer
} = useCommerceCart()
const {
  items: bookingCart,
  loading: bookingLoading,
  drawerOpen: bookingOpen,
  selectedIdSet: bookingSelectedIdSet,
  selectedLines: bookingSelectedLines,
  selectedTotal: bookingSelectedTotal,
  allSelected: bookingAllSelected,
  count: bookingCount,
  refresh: refreshBookingCart,
  remove: removeBookingLine,
  toggleLine: toggleBookingLine,
  toggleSelectAll: toggleBookingSelectAll,
  checkout: checkoutBookingCart,
  clear: clearBookingCart,
  openDrawer: openBookingDrawer,
  closeDrawer: closeBookingDrawer
} = useBookingCart()
const { addresses, refresh: refreshAddresses } = useAddressBook()
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
const cartActionId = ref<number | null>(null)
const cartError = ref('')
const bookingActionId = ref<string | null>(null)
const bookingError = ref('')
const bookingCheckoutLoading = ref(false)
const checkoutOpen = ref(false)
const checkoutAddressId = ref<number | null>(null)
const checkoutLoading = ref(false)
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
const lineInitial = (name: string) => (name?.trim()?.charAt(0) || '·').toUpperCase()
// 结算弹层与侧栏共用滚动锁，单独记账避免关弹层时误解锁仍打开的侧栏
let checkoutScrollLocked = false
watch(checkoutOpen, (open) => {
  if (!import.meta.client) return
  if (open && !checkoutScrollLocked) {
    acquireScrollLock()
    checkoutScrollLocked = true
  } else if (!open && checkoutScrollLocked) {
    releaseScrollLock()
    checkoutScrollLocked = false
  }
})
onBeforeUnmount(() => {
  if (checkoutScrollLocked) {
    releaseScrollLock()
    checkoutScrollLocked = false
  }
})
const close = () => { open.value = false }
const closeProfileMenu = () => { profileMenuOpen.value = false }
const closeAllDrawers = () => {
  wishlistOpen.value = false
  closeCartDrawer()
  closeBookingDrawer()
  checkoutOpen.value = false
}
const handleDocumentPointerDown = (event: PointerEvent) => {
  if (profileMenuOpen.value && shouldCloseProfileMenu(event.target, profileTriggerRef.value, profileMenuRef.value)) closeProfileMenu()
}
const handleDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeProfileMenu()
}
const handleDocumentScroll = () => { closeProfileMenu() }
const avatarFailed = ref(false)

const openWishlist = async () => {
  close()
  closeAllDrawers()
  wishlistError.value = ''
  if (!authenticated.value) { await navigateTo(wishlistLoginRedirect()); return }
  wishlistOpen.value = true
  try { await refreshWishlist() } catch (cause) { wishlistError.value = cause instanceof Error ? cause.message : '心愿单加载失败' }
}
const openCart = async () => {
  close()
  closeAllDrawers()
  cartError.value = ''
  if (!authenticated.value) { await navigateTo(cartLoginRedirect()); return }
  openCartDrawer()
  try { await Promise.all([refreshCart(), refreshAddresses()]) }
  catch (cause) { cartError.value = cause instanceof Error ? cause.message : '购物车加载失败' }
}
const openBookingCart = async () => {
  close()
  closeAllDrawers()
  bookingError.value = ''
  if (!authenticated.value) { await navigateTo(bookingCartLoginRedirect()); return }
  openBookingDrawer()
  try { await refreshBookingCart() }
  catch (cause) { bookingError.value = cause instanceof Error ? cause.message : '点单车加载失败' }
}
const removeWishlistItem = async (productId: number) => {
  wishlistActionId.value = productId
  try { await removeWishlist(productId) } catch (cause) { wishlistError.value = cause instanceof Error ? cause.message : '移除心愿商品失败' }
  finally { wishlistActionId.value = null }
}
const addWishlistItemToCart = async (productId: number) => {
  wishlistActionId.value = productId
  try {
    await commerceApi.addToCart(productId, 1)
    await refreshCart()
  } catch (cause) { wishlistError.value = cause instanceof Error ? cause.message : '加入购物车失败' }
  finally { wishlistActionId.value = null }
}
const removeCartItem = async (productId: number) => {
  cartActionId.value = productId
  cartError.value = ''
  try { await removeCartLine(productId) }
  catch (cause) { cartError.value = cause instanceof Error ? cause.message : '移出购物车失败' }
  finally { cartActionId.value = null }
}
const removeBookingItem = async (lineId: string) => {
  bookingActionId.value = lineId
  bookingError.value = ''
  try { await removeBookingLine(lineId) }
  catch (cause) { bookingError.value = cause instanceof Error ? cause.message : '移出点单车失败' }
  finally { bookingActionId.value = null }
}
const openCheckout = async () => {
  if (!cartSelectedLines.value.length) return
  cartError.value = ''
  try {
    if (!addresses.value.length) await refreshAddresses()
  } catch (cause) { cartError.value = cause instanceof Error ? cause.message : '地址加载失败'; return }
  checkoutAddressId.value = addresses.value.find(a => a.isDefault)?.id ?? addresses.value[0]?.id ?? null
  openCommerceCheckout(cartOpen, checkoutOpen)
}
const submitOrder = async () => {
  if (!checkoutAddressId.value) { cartError.value = '请选择收货地址'; return }
  checkoutLoading.value = true
  cartError.value = ''
  try {
    const orderId = await commerceApi.createOrder(cartSelectedLines.value.map(line => line.productId), checkoutAddressId.value)
    await refreshCart()
    checkoutOpen.value = false
    closeCartDrawer()
    await navigateTo(`/shop/orders/${orderId}`)
  } catch (cause) { cartError.value = cause instanceof Error ? cause.message : '创建订单失败' }
  finally { checkoutLoading.value = false }
}
const submitBookingCheckout = async () => {
  if (!bookingSelectedLines.value.length) return
  bookingCheckoutLoading.value = true
  bookingError.value = ''
  try {
    const groupId = await checkoutBookingCart()
    closeBookingDrawer()
    await navigateTo(`/bookings/groups/${groupId}`)
  } catch (cause) { bookingError.value = cause instanceof Error ? cause.message : '结算点单车失败' }
  finally { bookingCheckoutLoading.value = false }
}
const goMine = async () => {
  close()
  await navigateTo(authenticated.value ? '/profile' : '/auth')
}
const headerInitial = computed(() => userName.value.trim() ? userName.value.trim().slice(0, 1).toLocaleUpperCase() : '✦')
const badge = (count: number) => count > 99 ? '99+' : String(count)
const clearOpenQuery = async (key: string) => {
  const query = { ...route.query }
  delete query[key]
  await navigateTo({ path: route.path, query, hash: '' }, { replace: true })
}

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
  } catch { /* 头像拉取失败时仍用首字母兜底，不影响顶栏可用 */ }
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  document.removeEventListener('keydown', handleDocumentKeydown)
  document.removeEventListener('scroll', handleDocumentScroll)
})
watch(authenticated, async value => {
  if (!value) {
    clearWishlist()
    clearCart()
    clearBookingCart()
    closeAllDrawers()
    return
  }
  try { await Promise.all([refreshWishlist(), refreshCart(), refreshBookingCart()]) } catch { /* 预拉失败不打断顶栏；打开侧栏时再提示 */ }
}, { immediate: true })
watch([authenticated, () => route.query.openWishlist], async ([isAuthenticated, intent]) => {
  if (!isAuthenticated || intent !== '1') return
  await openWishlist()
  await clearOpenQuery('openWishlist')
}, { immediate: true })
watch([authenticated, () => route.query.openCart], async ([isAuthenticated, intent]) => {
  if (!isAuthenticated || intent !== '1') return
  await openCart()
  await clearOpenQuery('openCart')
}, { immediate: true })
watch([authenticated, () => route.query.openBookingCart], async ([isAuthenticated, intent]) => {
  if (!isAuthenticated || intent !== '1') return
  await openBookingCart()
  await clearOpenQuery('openBookingCart')
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
        <NuxtLink to="/" @click="close">{{ t('nav.home') }}</NuxtLink>
        <NuxtLink to="/companions" @click="close">{{ t('nav.companions') }}</NuxtLink>
        <NuxtLink to="/shop" @click="close">{{ t('nav.shop') }}</NuxtLink>
        <NuxtLink v-if="authenticated" to="/profile" @click="close">{{ t('nav.mine') }}</NuxtLink>
        <button v-else type="button" class="nav-text-button" @click="goMine">{{ t('nav.mine') }}</button>
      </nav>
      <div class="header-actions">
        <button class="header-icon-btn wishlist-count" type="button" :aria-label="t('nav.wishlist')" :title="t('nav.wishlist')" @click="openWishlist">
          <svg class="header-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M12 20.4s-6.8-4.2-9.1-8.1C1.3 9.7 2.1 6.4 5 5.3c1.8-.7 3.8-.1 4.9 1.4L12 9l2.1-2.3c1.1-1.5 3.1-2.1 4.9-1.4 2.9 1.1 3.7 4.4 2.1 7-2.3 3.9-9.1 8.1-9.1 8.1Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
          </svg>
          <span v-if="wishlistSummary.count > 0" class="header-badge">{{ badge(wishlistSummary.count) }}</span>
        </button>
        <button class="header-icon-btn cart-count" type="button" :aria-label="t('nav.cart')" :title="t('nav.cart')" @click="openCart">
          <svg class="header-icon header-icon--cart" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M3.2 5.2h2.1l1.55 11.2a1.9 1.9 0 0 0 1.88 1.65h9.55a1.9 1.9 0 0 0 1.87-1.55L21.2 8.1H7.35" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="10.1" cy="20.35" r="1.35" fill="currentColor"/>
            <circle cx="17.3" cy="20.35" r="1.35" fill="currentColor"/>
          </svg>
          <span v-if="cartCount > 0" class="header-badge">{{ badge(cartCount) }}</span>
        </button>
        <button class="header-icon-btn booking-count" type="button" :aria-label="t('nav.bookingCart')" :title="t('nav.bookingCart')" @click="openBookingCart">
          <svg class="header-icon header-icon--booking" viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <rect x="4.2" y="5.2" width="15.6" height="14.2" rx="2.2" stroke="currentColor" stroke-width="1.7"/>
            <path d="M8 3.8v3.2M16 3.8v3.2M4.2 9.4h15.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            <path d="M8.4 13.2h3.2M8.4 16.2h7.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          <span v-if="bookingCount > 0" class="header-badge">{{ badge(bookingCount) }}</span>
        </button>
        <button class="header-icon-btn header-utility-btn" type="button" :aria-label="t('nav.theme')" :title="t('nav.theme')" @click="toggleTheme">
          <svg v-if="theme === 'dark'" class="header-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"><circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28l-1.42 1.42M6.7 17.3l-1.42 1.42M18.72 18.72l-1.42-1.42M6.7 6.7 5.28 5.28" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
          <svg v-else class="header-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none"><path d="M20.2 15.2A8.7 8.7 0 0 1 8.8 3.8 8.7 8.7 0 1 0 20.2 15.2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>
        </button>
        <button class="header-icon-btn header-language-btn" type="button" :aria-label="t('nav.languageHint')" :title="t('nav.languageHint')" @click="toggleLocale">{{ locale === 'zh' ? 'EN' : '中' }}</button>
        <div v-if="authenticated" class="profile-menu">
          <button ref="profileTriggerRef" class="profile-chip" type="button" :title="t('profile.title')" :aria-expanded="profileMenuOpen" aria-haspopup="menu" @click="profileMenuOpen = !profileMenuOpen"><img v-if="userAvatarUrl && !avatarFailed" :src="userAvatarUrl" alt="" @error="avatarFailed = true"><span v-else>{{ headerInitial }}</span></button>
          <div v-if="profileMenuOpen" ref="profileMenuRef" class="profile-menu-popover" role="menu">
            <div class="profile-menu-heading"><span>{{ userName || 'Stargazer' }}</span><small>{{ companionApproved ? 'COMPANION' : 'MEMBER' }}</small></div>
            <NuxtLink to="/profile" role="menuitem" @click="closeProfileMenu"><span>{{ t('nav.profileHome') }}</span><small>{{ t('nav.profileHomeHint') }}</small></NuxtLink>
            <NuxtLink v-if="companionApproved" to="/companion/card" role="menuitem" @click="closeProfileMenu"><span>{{ t('nav.companionCard') }}</span><small>{{ t('nav.companionCardHint') }}</small></NuxtLink>
            <button type="button" role="menuitem" class="profile-menu-action danger" @click="closeProfileMenu(); showLogoutConfirm = true"><span>{{ t('auth.logout') }}</span><small>{{ t('nav.logoutHint') }}</small></button>
          </div>
        </div>
        <NuxtLink v-else to="/auth" class="auth-link" @click="close">{{ t('auth.login') }}</NuxtLink>
      </div>
    </div>
  </header>

  <SideDrawer
    :open="wishlistOpen"
    :title="t('nav.wishlist')"
    :subtitle="t('nav.wishlistCount', { count: wishlistSummary.count })"
    title-id="header-wishlist-title"
    overlay-key="wishlist"
    @close="wishlistOpen = false"
  >
    <template #alert>
      <p v-if="wishlistError" class="commerce-alert" role="alert">{{ wishlistError }}</p>
    </template>
    <p v-if="wishlistLoading && !wishlist.length" class="empty-state">{{ t('nav.wishlistLoading') }}</p>
    <div v-else-if="wishlist.length" class="side-drawer-lines">
      <article v-for="line in wishlist" :key="line.productId" class="has-thumb">
        <span class="side-drawer-thumb" aria-hidden="true">{{ lineInitial(line.productName) }}</span>
        <div class="side-drawer-line-main">
          <h3>{{ line.productName }}</h3>
          <div class="side-drawer-meta-row">
            <p>{{ t('nav.wishlistAdded', { date: new Date(line.addedAt).toLocaleDateString() }) }}</p>
            <button class="drawer-text-action is-primary" type="button" :disabled="wishlistActionId === line.productId" @click="addWishlistItemToCart(line.productId)">{{ t('nav.wishlistToCart') }}</button>
          </div>
        </div>
        <div class="side-drawer-line-aside">
          <strong>{{ money(line.unitPrice) }}</strong>
          <button class="drawer-remove-btn" type="button" :disabled="wishlistActionId === line.productId" @click="removeWishlistItem(line.productId)">{{ t('nav.cartRemove') }}</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">{{ t('nav.wishlistEmpty') }}</p>
    <template v-if="wishlist.length" #footer>
      <p class="drawer-footer-summary"><span>{{ t('nav.wishlistCount', { count: wishlistSummary.count }) }}</span><strong>{{ money(wishlistSummary.total) }}</strong></p>
      <button class="button button-primary" type="button" @click="wishlistOpen = false; navigateTo('/shop')">{{ t('nav.wishlistContinue') }}</button>
    </template>
  </SideDrawer>

  <SideDrawer
    :open="cartOpen"
    :title="t('nav.cart')"
    :subtitle="t('nav.cartCount', { count: cartCount })"
    title-id="header-cart-title"
    overlay-key="cart"
    @close="closeCartDrawer"
  >
    <template #alert>
      <p v-if="cartError && !checkoutOpen" class="commerce-alert" role="alert">{{ cartError }}</p>
    </template>
    <p v-if="cartLoading && !cart.length" class="empty-state">{{ t('nav.cartLoading') }}</p>
    <div v-else-if="cart.length" class="side-drawer-lines">
      <article v-for="line in cart" :key="line.productId" class="has-check">
        <label class="cart-line-checkbox">
          <input class="drawer-check" type="checkbox" :checked="cartSelectedIdSet.has(line.productId)" :aria-label="line.productName" @change="toggleCartLine(line.productId)">
        </label>
        <span class="side-drawer-thumb" aria-hidden="true">{{ lineInitial(line.productName) }}</span>
        <div class="side-drawer-line-main">
          <h3>{{ line.productName }}</h3>
          <p>{{ money(line.unitPrice) }} × {{ line.quantity }}</p>
        </div>
        <div class="side-drawer-line-aside">
          <strong>{{ money(line.subtotal) }}</strong>
          <button class="drawer-remove-btn" type="button" :disabled="cartActionId === line.productId" @click="removeCartItem(line.productId)">{{ t('nav.cartRemove') }}</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">{{ t('nav.cartEmpty') }}</p>
    <template #footer>
      <template v-if="cart.length">
        <div class="drawer-footer-summary">
          <label class="cart-select-all">
            <input class="drawer-check" type="checkbox" :checked="cartAllSelected" @change="toggleCartSelectAll">
            {{ t('nav.cartSelectAll') }}
          </label>
          <strong>{{ money(cartSelectedTotal) }}</strong>
        </div>
        <p class="drawer-footer-note">{{ t('nav.cartSelectedTotal', { count: cartSelectedLines.length }) }}</p>
        <button class="button button-primary" type="button" :disabled="!cartSelectedLines.length" @click="openCheckout">{{ t('nav.cartCheckout') }}</button>
      </template>
      <button v-else class="button button-primary" type="button" @click="closeCartDrawer(); navigateTo('/shop')">{{ t('nav.cartContinue') }}</button>
    </template>
  </SideDrawer>

  <SideDrawer
    :open="bookingOpen"
    :title="t('nav.bookingCart')"
    :subtitle="t('nav.bookingCartCount', { count: bookingCount })"
    title-id="header-booking-cart-title"
    overlay-key="booking-cart"
    @close="closeBookingDrawer"
  >
    <template #alert>
      <p v-if="bookingError" class="commerce-alert" role="alert">{{ bookingError }}</p>
    </template>
    <p v-if="bookingLoading && !bookingCart.length" class="empty-state">{{ t('nav.bookingCartLoading') }}</p>
    <div v-else-if="bookingCart.length" class="side-drawer-lines">
      <article v-for="line in bookingCart" :key="String(line.id)" class="has-check">
        <label class="cart-line-checkbox">
          <input class="drawer-check" type="checkbox" :checked="bookingSelectedIdSet.has(String(line.id))" :aria-label="`陪玩 #${line.companionId}`" @change="toggleBookingLine(line.id)">
        </label>
        <span class="side-drawer-thumb" aria-hidden="true">{{ String(line.companionId).slice(-1) }}</span>
        <div class="side-drawer-line-main">
          <h3>陪玩 #{{ line.companionId }}{{ line.companionBookable ? '' : `（${t('nav.bookingCartUnavailable')}）` }}</h3>
          <p>{{ new Date(line.start).toLocaleString() }} · {{ t('nav.bookingCartHours', { hours: line.durationHours }) }}</p>
        </div>
        <div class="side-drawer-line-aside">
          <strong>{{ money(line.estimatedPrice) }}</strong>
          <button class="drawer-remove-btn" type="button" :disabled="bookingActionId === String(line.id)" @click="removeBookingItem(String(line.id))">{{ t('nav.cartRemove') }}</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">{{ t('nav.bookingCartEmpty') }}</p>
    <template #footer>
      <template v-if="bookingCart.length">
        <div class="drawer-footer-summary">
          <label class="cart-select-all">
            <input class="drawer-check" type="checkbox" :checked="bookingAllSelected" @change="toggleBookingSelectAll">
            {{ t('nav.cartSelectAll') }}
          </label>
          <strong>{{ money(bookingSelectedTotal) }}</strong>
        </div>
        <p class="drawer-footer-note">{{ t('nav.bookingCartSelectedTotal', { count: bookingSelectedLines.length }) }}</p>
        <button class="button button-primary" type="button" :disabled="bookingCheckoutLoading || !bookingSelectedLines.length" @click="submitBookingCheckout">{{ bookingCheckoutLoading ? t('nav.bookingCartCheckoutWorking') : t('nav.bookingCartCheckout') }}</button>
      </template>
      <button v-else class="button button-primary" type="button" @click="closeBookingDrawer(); navigateTo('/companions')">{{ t('nav.bookingCartContinue') }}</button>
    </template>
  </SideDrawer>

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="checkoutOpen" class="product-modal-backdrop shop-overlay" data-shop-overlay="checkout" @click.self="checkoutOpen = false">
        <section class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="header-checkout-title">
          <button class="modal-close" type="button" :aria-label="t('modal.close')" @click="checkoutOpen = false">×</button>
          <p class="eyebrow"><span />CHECKOUT</p>
          <h2 id="header-checkout-title">确认收货信息</h2>
          <p>订单将使用购物车中已选的 {{ cartSelectedLines.length }} 件商品。</p>
          <p v-if="cartError" class="commerce-alert" role="alert">{{ cartError }}</p>
          <div v-if="addresses.length" class="address-picker">
            <label v-for="address in addresses" :key="address.id" class="address-picker-option" :class="{ active: checkoutAddressId === address.id }">
              <input v-model="checkoutAddressId" type="radio" name="header-checkout-address" :value="address.id">
              <div>
                <strong>{{ address.recipientName }} · {{ address.phone }}</strong>
                <p>{{ address.addressType === 'DOMESTIC' ? `${address.city}${address.district}` : `${address.city}、${address.countryCode}` }} {{ address.addressLine1 }}</p>
              </div>
            </label>
          </div>
          <p v-else class="empty-state">还没有保存的收货地址。</p>
          <NuxtLink to="/account/addresses" class="address-manage-link">管理收货地址 →</NuxtLink>
          <p class="checkout-total">合计 <strong>{{ money(cartSelectedTotal) }}</strong></p>
          <button class="button button-primary" type="button" :disabled="checkoutLoading || !checkoutAddressId" @click="submitOrder">{{ checkoutLoading ? '正在创建订单…' : '提交订单' }}</button>
        </section>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <div v-if="showLogoutConfirm" class="confirm-overlay" role="presentation" @click.self="showLogoutConfirm = false">
      <section class="confirm-dialog" role="dialog" aria-modal="true" :aria-label="t('auth.logoutConfirmTitle')">
        <p class="eyebrow"><span />MYSTIKOS</p>
        <h2>{{ t('auth.logoutConfirmTitle') }}</h2>
        <p>{{ t('auth.logoutConfirmBody') }}</p>
        <div class="confirm-actions"><button class="button button-ghost" type="button" @click="showLogoutConfirm = false">{{ t('auth.cancel') }}</button><button class="button button-primary" type="button" @click="confirmLogout">{{ t('auth.confirmLogout') }}</button></div>
      </section>
    </div>
  </Teleport>
</template>
