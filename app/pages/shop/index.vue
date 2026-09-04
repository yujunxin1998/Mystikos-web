<script setup lang="ts">
import type { ProductView } from '../../composables/useCommerceApi'
import { requireCommerceLogin } from '../../utils/commerce-api.mjs'
import { dialogFocusIndex, productImageSource, recoverProductImage, shopErrorPresentation, shopErrorSurface } from '../../utils/shop-presentation.mjs'

const { t } = useMystikos()
const { authenticated } = useDemoAuth()
const api = useCommerceApi()
const { items: wishlist, refresh: refreshWishlist, add: addWishlist, remove: removeWishlist, clear: clearWishlist } = useCommerceWishlist()
const { count: cartCount, refresh: refreshCart, add: addCartLine, clear: clearCart, openDrawer: openCartDrawer } = useCommerceCart()
const { addresses, refresh: refreshAddresses } = useAddressBook()

const products = ref<ProductView[]>([])
const selected = ref<ProductView | null>(null)
const productQuantity = ref(1)
const category = ref<number | 'all'>('all')
const loading = ref(true)
const actionId = ref<number | null>(null)
const error = ref('')
const productLoadFailed = ref(false)

const buyNowOpen = ref(false)
const buyNowProduct = ref<ProductView | null>(null)
const buyNowQuantity = ref(1)
const buyNowAddressId = ref<number | null>(null)
const buyNowLoading = ref(false)

const categories = computed(() => ['all' as const, ...new Set(products.value.map(product => product.categoryId))])
const filteredProducts = computed(() => category.value === 'all' ? products.value : products.value.filter(product => product.categoryId === category.value))
const wishlistIds = computed(() => new Set(wishlist.value.map(line => line.productId)))
const errorPresentation = computed(() => shopErrorPresentation(productLoadFailed.value))
const activeOverlayKey = computed(() => selected.value ? 'product' : buyNowOpen.value ? 'buy-now' : '')
const errorSurface = computed(() => shopErrorSurface(error.value, productLoadFailed.value, activeOverlayKey.value))
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
const imageFor = (product: ProductView) => productImageSource(product.images)

const requireLogin = () => requireCommerceLogin(authenticated.value, (path: string) => navigateTo(path))

const loadProducts = async () => {
  loading.value = true
  error.value = ''
  productLoadFailed.value = false
  try { products.value = await api.listProducts() || [] }
  catch (cause) { productLoadFailed.value = true; error.value = cause instanceof Error ? cause.message : '商品加载失败' }
  finally { loading.value = false }
}

const loadMemberCommerce = async () => {
  if (!authenticated.value) { clearWishlist(); clearCart(); return }
  // 心愿单 / 购物车 / 地址是登录后的附属数据；任一失败不应挡住商品浏览页。
  await Promise.allSettled([refreshWishlist(), refreshCart(), refreshAddresses()])
}

const openProduct = async (productId: number) => {
  error.value = ''
  productQuantity.value = 1
  try { selected.value = await api.getProduct(productId) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '商品详情加载失败' }
}

const toggleWishlist = async (productId: number) => {
  if (!(await requireLogin())) return
  actionId.value = productId
  error.value = ''
  try {
    if (wishlistIds.value.has(productId)) await removeWishlist(productId)
    else await addWishlist(productId)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '心愿单更新失败' }
  finally { actionId.value = null }
}

const addToCart = async (productId: number, quantity = 1) => {
  if (!(await requireLogin())) return
  actionId.value = productId
  error.value = ''
  try {
    await addCartLine(productId, quantity)
    selected.value = null
    openCartDrawer()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '加入购物车失败' }
  finally { actionId.value = null }
}

const openCart = async () => {
  if (!(await requireLogin())) return
  error.value = ''
  try {
    await Promise.all([refreshCart(), refreshAddresses()])
    openCartDrawer()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '购物车加载失败' }
}

const openBuyNow = async (product: ProductView) => {
  if (!(await requireLogin())) return
  buyNowProduct.value = product
  buyNowQuantity.value = 1
  buyNowAddressId.value = addresses.value.find(a => a.isDefault)?.id ?? addresses.value[0]?.id ?? null
  buyNowOpen.value = true
}
const closeBuyNow = () => { buyNowOpen.value = false; buyNowProduct.value = null }
const submitBuyNow = async () => {
  if (!buyNowProduct.value || !buyNowAddressId.value) { error.value = '请选择收货地址'; return }
  buyNowLoading.value = true
  error.value = ''
  try {
    const orderId = await api.buyNow(buyNowProduct.value.id, buyNowQuantity.value, buyNowAddressId.value)
    buyNowOpen.value = false
    await navigateTo(`/shop/orders/${orderId}`)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '创建订单失败' }
  finally { buyNowLoading.value = false }
}

let previousDialogFocus: HTMLElement | null = null
const closeActiveOverlay = () => {
  if (selected.value) selected.value = null
  else if (buyNowOpen.value) closeBuyNow()
}

const activeOverlayElement = () => {
  const overlays = [...document.querySelectorAll<HTMLElement>('[data-shop-overlay]')]
  return overlays.at(-1) || null
}

const dialogFocusableElements = () => {
  const overlay = activeOverlayElement()
  if (!overlay) return []
  const alert = document.querySelector<HTMLElement>('.shop-overlay-alert')
  const roots = alert ? [overlay, alert] : [overlay]
  return roots.flatMap(root => [...root.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')])
    .filter(element => element.getAttribute('aria-hidden') !== 'true')
}

const handleDialogKeydown = (event: KeyboardEvent) => {
  if (!activeOverlayKey.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeActiveOverlay()
    return
  }
  if (event.key !== 'Tab') return
  const focusable = dialogFocusableElements()
  const nextIndex = dialogFocusIndex(focusable.indexOf(document.activeElement as HTMLElement), focusable.length, event.shiftKey)
  if (nextIndex < 0) return
  event.preventDefault()
  focusable[nextIndex]?.focus()
}

watch(activeOverlayKey, async (key, previousKey) => {
  if (!import.meta.client) return
  if (key) {
    if (!previousKey) previousDialogFocus = document.activeElement as HTMLElement | null
    await nextTick()
    activeOverlayElement()?.querySelector<HTMLElement>('.modal-close')?.focus()
  } else if (previousKey) {
    previousDialogFocus?.focus()
    previousDialogFocus = null
  }
})

watch(authenticated, loadMemberCommerce, { immediate: true })
onMounted(() => {
  document.addEventListener('keydown', handleDialogKeydown)
  loadProducts()
})
onBeforeUnmount(() => document.removeEventListener('keydown', handleDialogKeydown))
</script>

<template>
  <div class="shop-page shop-cosmos">
    <div class="shop-cosmos-sky" aria-hidden="true"><i /><i /><i /><i /></div>

    <section class="shop-hero section-wrap">
      <div class="shop-hero-copy">
        <p class="eyebrow"><span />{{ t('shop.eyebrow') }}</p>
        <div class="shop-title-lockup"><i aria-hidden="true" /><h1>{{ t('shop.title') }}</h1><span aria-hidden="true">✦</span></div>
      </div>
      <div class="shop-hero-aside" aria-hidden="true">
        <div class="shop-hero-orbit"><i /><i /><span>✦</span><div class="shop-hero-object">M</div></div>
      </div>
    </section>

    <section class="shop-content section-wrap">
      <div v-if="errorSurface === 'page'" class="commerce-alert" role="alert">
        <span aria-hidden="true">!</span>
        <div><strong>{{ errorPresentation.title }}</strong><p>{{ error }}</p></div>
        <button v-if="errorPresentation.action === 'retry'" type="button" @click="loadProducts">重新加载</button>
        <button v-else type="button" @click="error = ''">关闭提示</button>
      </div>

      <div class="shop-toolbar">
        <div><p class="eyebrow"><span />COLLECTION</p><h2>浏览藏品</h2></div>
        <div class="shop-toolbar-actions">
          <div class="category-list" :aria-label="t('shop.filter')">
            <button v-for="item in categories" :key="item" :class="{ active: category === item }" :aria-pressed="category === item" @click="category = item">{{ item === 'all' ? t('shop.all') : `分类 ${item}` }}</button>
          </div>
          <button class="shop-cart-trigger" type="button" @click="openCart">
            <span class="shop-cart-icon" aria-hidden="true">⌑</span><span>购物车<small>查看已选藏品</small></span><strong>{{ cartCount }}</strong>
          </button>
        </div>
      </div>

      <div v-if="loading" class="product-grid product-grid-loading" aria-label="正在加载商品" aria-busy="true">
        <article v-for="item in 3" :key="item" class="product-card product-skeleton" aria-hidden="true"><div /><span /><b /><small /></article>
      </div>
      <div v-else-if="filteredProducts.length" class="product-grid">
        <article v-for="product in filteredProducts" :key="product.id" class="product-card">
          <div class="product-visual">
            <span class="product-category">分类 {{ product.categoryId }}</span>
            <button class="product-image-button" :aria-label="`${t('shop.details')}: ${product.name}`" @click="openProduct(product.id)">
              <img :src="imageFor(product)" :alt="product.name" loading="lazy" @error="recoverProductImage">
              <span class="product-zoom">查看详情 <b aria-hidden="true">↗</b></span>
            </button>
            <button class="wishlist-button" :class="{ saved: wishlistIds.has(product.id) }" :disabled="actionId === product.id" :aria-label="wishlistIds.has(product.id) ? t('modal.remove') : t('shop.wishlist')" @click="toggleWishlist(product.id)">♡</button>
          </div>
          <div class="product-info">
            <div><small>MYSTIKOS · SELECTED</small><h2>{{ product.name }}</h2></div>
            <strong>{{ money(product.price) }}</strong>
          </div>
          <div class="product-card-actions">
            <button class="button button-primary product-cart-button" :disabled="actionId === product.id" @click="addToCart(product.id)"><span aria-hidden="true">＋</span>加入购物车</button>
            <button class="button product-buy-now-button" :disabled="actionId === product.id" @click="openBuyNow(product)">立即购买<span aria-hidden="true">→</span></button>
          </div>
        </article>
      </div>
      <div v-else class="empty-state shop-empty-state"><span aria-hidden="true">✦</span><h3>{{ t('shop.empty') }}</h3><p>换一个分类看看，新的公会藏品也会陆续抵达。</p></div>
      <p class="shop-note"><i aria-hidden="true" />已接入 Mystikos 商城服务 <span v-if="wishlist.length">· {{ wishlist.length }} 件心愿商品</span></p>
    </section>

  <Teleport to="body"><Transition name="fade"><div v-if="errorSurface === 'overlay'" class="shop-overlay-alert" role="alert"><span aria-hidden="true">!</span><div><strong>{{ errorPresentation.title }}</strong><p>{{ error }}</p></div><button type="button" aria-label="关闭错误提示" @click="error = ''">×</button></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="selected" class="product-modal-backdrop shop-overlay" data-shop-overlay="product" @click.self="selected = null"><section class="product-modal" role="dialog" aria-modal="true" :aria-label="selected.name"><button class="modal-close" :aria-label="t('modal.close')" @click="selected = null">×</button><img :src="imageFor(selected)" :alt="selected.name" @error="recoverProductImage"><div><p class="eyebrow"><span />分类 {{ selected.categoryId }}</p><h2>{{ selected.name }}</h2><strong>{{ money(selected.price) }}</strong><p>{{ selected.description }}</p><div class="quantity-stepper"><button type="button" :disabled="productQuantity <= 1" aria-label="减少数量" @click="productQuantity--">−</button><span>{{ productQuantity }}</span><button type="button" aria-label="增加数量" @click="productQuantity++">+</button></div><div class="commerce-actions"><button class="button" @click="toggleWishlist(selected.id)">{{ wishlistIds.has(selected.id) ? t('modal.remove') : t('shop.wishlist') }}</button><button class="button button-primary" @click="addToCart(selected.id, productQuantity)">加入购物车</button></div></div></section></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="buyNowOpen" class="product-modal-backdrop shop-overlay" data-shop-overlay="buy-now" @click.self="closeBuyNow"><section class="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="shop-buy-now-title">
    <button class="modal-close" :aria-label="t('modal.close')" @click="closeBuyNow">×</button>
    <p class="eyebrow"><span />BUY NOW</p><h2 id="shop-buy-now-title">立即购买</h2>
    <p v-if="buyNowProduct">{{ buyNowProduct.name }} · {{ money(buyNowProduct.price) }}</p>
    <div class="quantity-stepper"><button type="button" :disabled="buyNowQuantity <= 1" aria-label="减少数量" @click="buyNowQuantity--">−</button><span>{{ buyNowQuantity }}</span><button type="button" aria-label="增加数量" @click="buyNowQuantity++">+</button></div>
    <div v-if="addresses.length" class="address-picker">
      <label v-for="address in addresses" :key="address.id" class="address-picker-option" :class="{ active: buyNowAddressId === address.id }">
        <input v-model="buyNowAddressId" type="radio" name="buy-now-address" :value="address.id">
        <div><strong>{{ address.recipientName }} · {{ address.phone }}</strong><p>{{ address.addressType === 'DOMESTIC' ? `${address.city}${address.district}` : `${address.city}、${address.countryCode}` }} {{ address.addressLine1 }}</p></div>
      </label>
    </div>
    <p v-else class="empty-state">还没有保存的收货地址。</p>
    <NuxtLink to="/account/addresses" class="address-manage-link">管理收货地址 →</NuxtLink>
    <p v-if="buyNowProduct" class="checkout-total">合计 <strong>{{ money(buyNowProduct.price * buyNowQuantity) }}</strong></p>
    <button class="button button-primary" :disabled="buyNowLoading || !buyNowAddressId" @click="submitBuyNow">{{ buyNowLoading ? '正在创建订单…' : '直接购买并支付' }}</button>
  </section></div></Transition></Teleport>
  </div>
</template>
