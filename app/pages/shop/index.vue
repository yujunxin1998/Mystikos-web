<script setup lang="ts">
import type { CartLine, ProductView } from '../../composables/useCommerceApi'
import { openCommerceCheckout, requireCommerceLogin } from '../../utils/commerce-api.mjs'

const { t } = useMystikos()
const { authenticated } = useDemoAuth()
const api = useCommerceApi()
const { items: wishlist, refresh: refreshWishlist, add: addWishlist, remove: removeWishlist, clear: clearWishlist } = useCommerceWishlist()
const { addresses, refresh: refreshAddresses } = useAddressBook()

const products = ref<ProductView[]>([])
const cart = ref<CartLine[]>([])
const selectedCartIds = ref<Set<number>>(new Set())
const selected = ref<ProductView | null>(null)
const productQuantity = ref(1)
const category = ref<number | 'all'>('all')
const cartOpen = ref(false)
const checkoutOpen = ref(false)
const checkoutAddressId = ref<number | null>(null)
const loading = ref(true)
const actionId = ref<number | null>(null)
const checkoutLoading = ref(false)
const error = ref('')

const buyNowOpen = ref(false)
const buyNowProduct = ref<ProductView | null>(null)
const buyNowQuantity = ref(1)
const buyNowAddressId = ref<number | null>(null)
const buyNowLoading = ref(false)

const categories = computed(() => ['all' as const, ...new Set(products.value.map(product => product.categoryId))])
const filteredProducts = computed(() => category.value === 'all' ? products.value : products.value.filter(product => product.categoryId === category.value))
const wishlistIds = computed(() => new Set(wishlist.value.map(line => line.productId)))
const selectedCartLines = computed(() => cart.value.filter(line => selectedCartIds.value.has(line.productId)))
const cartCount = computed(() => cart.value.reduce((count, line) => count + line.quantity, 0))
const cartTotal = computed(() => selectedCartLines.value.reduce((total, line) => total + Number(line.subtotal), 0))
const allSelected = computed(() => cart.value.length > 0 && selectedCartIds.value.size === cart.value.length)
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
const imageFor = (product: ProductView) => product.images?.[0] || '/images/product-placeholder.svg'

const requireLogin = () => requireCommerceLogin(authenticated.value, (path: string) => navigateTo(path))

const loadProducts = async () => {
  loading.value = true
  error.value = ''
  try { products.value = await api.listProducts() || [] }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '商品加载失败' }
  finally { loading.value = false }
}

const loadMemberCommerce = async () => {
  if (!authenticated.value) { clearWishlist(); cart.value = []; selectedCartIds.value = new Set(); return }
  try {
    const [, nextCart] = await Promise.all([refreshWishlist(), api.getCart(), refreshAddresses()])
    cart.value = nextCart || []
    selectedCartIds.value = new Set(cart.value.map(line => line.productId))
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '商城账户数据加载失败' }
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
    await api.addToCart(productId, quantity)
    cart.value = await api.getCart() || []
    selectedCartIds.value = new Set(cart.value.map(line => line.productId))
    selected.value = null
    cartOpen.value = true
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '加入购物车失败' }
  finally { actionId.value = null }
}

const removeFromCart = async (productId: number) => {
  actionId.value = productId
  try {
    await api.removeFromCart(productId)
    cart.value = await api.getCart() || []
    selectedCartIds.value = new Set([...selectedCartIds.value].filter(id => id !== productId))
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '移出购物车失败' }
  finally { actionId.value = null }
}

const toggleCartLine = (productId: number) => {
  const next = new Set(selectedCartIds.value)
  if (next.has(productId)) next.delete(productId)
  else next.add(productId)
  selectedCartIds.value = next
}
const toggleSelectAll = () => {
  selectedCartIds.value = allSelected.value ? new Set() : new Set(cart.value.map(line => line.productId))
}

const openCart = async () => {
  if (!(await requireLogin())) return
  cart.value = await api.getCart() || []
  selectedCartIds.value = new Set(cart.value.map(line => line.productId))
  cartOpen.value = true
}

const openCheckout = () => {
  if (!selectedCartLines.value.length) return
  checkoutAddressId.value = addresses.value.find(a => a.isDefault)?.id ?? addresses.value[0]?.id ?? null
  openCommerceCheckout(cartOpen, checkoutOpen)
}

const submitOrder = async () => {
  if (!checkoutAddressId.value) { error.value = '请选择收货地址'; return }
  checkoutLoading.value = true
  error.value = ''
  try {
    const orderId = await api.createOrder([...selectedCartIds.value], checkoutAddressId.value)
    cart.value = await api.getCart() || []
    selectedCartIds.value = new Set(cart.value.map(line => line.productId))
    checkoutOpen.value = false
    cartOpen.value = false
    await navigateTo(`/shop/orders/${orderId}`)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '创建订单失败' }
  finally { checkoutLoading.value = false }
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

watch(authenticated, loadMemberCommerce, { immediate: true })
onMounted(loadProducts)
</script>

<template>
  <section class="shop-hero section-wrap">
    <div><p class="eyebrow"><span />{{ t('shop.eyebrow') }}</p><h1>{{ t('shop.title') }}</h1><p>{{ t('shop.body') }}</p></div>
    <button class="shop-cart-trigger" type="button" @click="openCart">购物车 <strong>{{ cartCount }}</strong></button>
  </section>

  <section class="shop-content section-wrap">
    <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
    <div class="shop-toolbar"><p>{{ t('shop.filter') }}</p><div class="category-list" role="tablist">
      <button v-for="item in categories" :key="item" :class="{ active: category === item }" :aria-selected="category === item" role="tab" @click="category = item">
        {{ item === 'all' ? t('shop.all') : `分类 ${item}` }}
      </button>
    </div></div>
    <p v-if="loading" class="empty-state">正在加载商品…</p>
    <div v-else-if="filteredProducts.length" class="product-grid">
      <article v-for="product in filteredProducts" :key="product.id" class="product-card">
        <button class="product-image-button" :aria-label="`${t('shop.details')}: ${product.name}`" @click="openProduct(product.id)"><img :src="imageFor(product)" :alt="product.name" loading="lazy"><span class="product-zoom">↗</span></button>
        <div class="product-info"><div><small>分类 {{ product.categoryId }}</small><h2>{{ product.name }}</h2><strong>{{ money(product.price) }}</strong></div><button class="wishlist-button" :class="{ saved: wishlistIds.has(product.id) }" :disabled="actionId === product.id" :aria-label="wishlistIds.has(product.id) ? t('modal.remove') : t('shop.wishlist')" @click="toggleWishlist(product.id)">♡</button></div>
        <div class="product-card-actions">
          <button class="button button-primary product-cart-button" :disabled="actionId === product.id" @click="addToCart(product.id)">加入购物车</button>
          <button class="button product-buy-now-button" :disabled="actionId === product.id" @click="openBuyNow(product)">立即购买</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">{{ t('shop.empty') }}</p>
    <p class="shop-note">已接入 Mystikos 商城服务 <span v-if="wishlist.length">· {{ wishlist.length }} 件心愿商品</span></p>
  </section>

  <Teleport to="body"><Transition name="fade"><div v-if="selected" class="product-modal-backdrop" role="presentation" @click.self="selected = null"><section class="product-modal" role="dialog" aria-modal="true" :aria-label="selected.name"><button class="modal-close" :aria-label="t('modal.close')" @click="selected = null">×</button><img :src="imageFor(selected)" :alt="selected.name"><div><p class="eyebrow"><span />分类 {{ selected.categoryId }}</p><h2>{{ selected.name }}</h2><strong>{{ money(selected.price) }}</strong><p>{{ selected.description }}</p><div class="quantity-stepper"><button type="button" :disabled="productQuantity <= 1" @click="productQuantity--">−</button><span>{{ productQuantity }}</span><button type="button" @click="productQuantity++">+</button></div><div class="commerce-actions"><button class="button" @click="toggleWishlist(selected.id)">{{ wishlistIds.has(selected.id) ? t('modal.remove') : t('shop.wishlist') }}</button><button class="button button-primary" @click="addToCart(selected.id, productQuantity)">加入购物车</button></div></div></section></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="cartOpen" class="commerce-drawer-backdrop" @click.self="cartOpen = false"><aside class="commerce-drawer" aria-label="购物车"><header><div><p class="eyebrow"><span />CART</p><h2>购物车</h2></div><button class="modal-close" @click="cartOpen = false">×</button></header>
    <label v-if="cart.length" class="cart-select-all"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll"> 全选</label>
    <div v-if="cart.length" class="cart-lines"><article v-for="line in cart" :key="line.productId"><label class="cart-line-checkbox"><input type="checkbox" :checked="selectedCartIds.has(line.productId)" @change="toggleCartLine(line.productId)"></label><div><h3>{{ line.productName }}</h3><p>{{ money(line.unitPrice) }} × {{ line.quantity }}</p></div><strong>{{ money(line.subtotal) }}</strong><button :disabled="actionId === line.productId" @click="removeFromCart(line.productId)">移除</button></article></div>
    <p v-else class="empty-state">购物车还是空的。</p>
    <footer v-if="cart.length"><p><span>合计（已选 {{ selectedCartLines.length }} 件）</span><strong>{{ money(cartTotal) }}</strong></p><button class="button button-primary" :disabled="!selectedCartLines.length" @click="openCheckout">填写地址并结算</button></footer>
  </aside></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="checkoutOpen" class="product-modal-backdrop" @click.self="checkoutOpen = false"><section class="checkout-modal" role="dialog" aria-modal="true" aria-label="创建商城订单"><button class="modal-close" @click="checkoutOpen = false">×</button><p class="eyebrow"><span />CHECKOUT</p><h2>确认收货信息</h2><p>订单将使用购物车中已选的 {{ selectedCartLines.length }} 件商品。</p>
    <div v-if="addresses.length" class="address-picker">
      <label v-for="address in addresses" :key="address.id" class="address-picker-option" :class="{ active: checkoutAddressId === address.id }">
        <input v-model="checkoutAddressId" type="radio" name="checkout-address" :value="address.id">
        <div><strong>{{ address.recipientName }} · {{ address.phone }}</strong><p>{{ address.addressType === 'DOMESTIC' ? `${address.city}${address.district}` : `${address.city}、${address.countryCode}` }} {{ address.addressLine1 }}</p></div>
      </label>
    </div>
    <p v-else class="empty-state">还没有保存的收货地址。</p>
    <NuxtLink to="/account/addresses" class="address-manage-link">管理收货地址 →</NuxtLink>
    <p class="checkout-total">合计 <strong>{{ money(cartTotal) }}</strong></p>
    <button class="button button-primary" :disabled="checkoutLoading || !checkoutAddressId" @click="submitOrder">{{ checkoutLoading ? '正在创建订单…' : '提交订单' }}</button>
  </section></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="buyNowOpen" class="product-modal-backdrop" @click.self="closeBuyNow"><section class="checkout-modal" role="dialog" aria-modal="true" aria-label="立即购买">
    <button class="modal-close" @click="closeBuyNow">×</button>
    <p class="eyebrow"><span />BUY NOW</p><h2>立即购买</h2>
    <p v-if="buyNowProduct">{{ buyNowProduct.name }} · {{ money(buyNowProduct.price) }}</p>
    <div class="quantity-stepper"><button type="button" :disabled="buyNowQuantity <= 1" @click="buyNowQuantity--">−</button><span>{{ buyNowQuantity }}</span><button type="button" @click="buyNowQuantity++">+</button></div>
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
</template>

<style scoped>
.product-card-actions { display: flex; gap: 8px; }
.product-buy-now-button { flex: none; }
.quantity-stepper { display: flex; align-items: center; gap: 12px; margin: 10px 0; }
.quantity-stepper button { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); cursor: pointer; }
.cart-select-all { display: flex; align-items: center; gap: 8px; padding: 0 4px; font-size: 12px; color: var(--muted); }
.cart-line-checkbox { display: flex; align-items: center; }
.address-picker { display: grid; gap: 10px; max-height: 220px; overflow-y: auto; margin: 12px 0; }
.address-picker-option { display: flex; gap: 10px; align-items: flex-start; padding: 10px; border: 1px solid var(--line); border-radius: 12px; cursor: pointer; }
.address-picker-option.active { border-color: var(--gold); background: var(--card); }
.address-picker-option p { margin: 4px 0 0; color: var(--muted); font-size: 12px; }
.address-manage-link { display: inline-block; margin-bottom: 12px; font-size: 12px; color: var(--lav-deep); }
</style>
