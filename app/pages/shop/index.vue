<script setup lang="ts">
import type { CartLine, ProductView } from '../../composables/useCommerceApi'
import { openCommerceCheckout, requireCommerceLogin } from '../../utils/commerce-api.mjs'

const { t } = useMystikos()
const { authenticated } = useDemoAuth()
const api = useCommerceApi()
const { items: wishlist, refresh: refreshWishlist, add: addWishlist, remove: removeWishlist, clear: clearWishlist } = useCommerceWishlist()

const products = ref<ProductView[]>([])
const cart = ref<CartLine[]>([])
const selected = ref<ProductView | null>(null)
const category = ref<number | 'all'>('all')
const cartOpen = ref(false)
const checkoutOpen = ref(false)
const shippingAddress = ref('')
const loading = ref(true)
const actionId = ref<number | null>(null)
const checkoutLoading = ref(false)
const error = ref('')

const categories = computed(() => ['all' as const, ...new Set(products.value.map(product => product.categoryId))])
const filteredProducts = computed(() => category.value === 'all' ? products.value : products.value.filter(product => product.categoryId === category.value))
const wishlistIds = computed(() => new Set(wishlist.value.map(line => line.productId)))
const cartCount = computed(() => cart.value.reduce((count, line) => count + line.quantity, 0))
const cartTotal = computed(() => cart.value.reduce((total, line) => total + Number(line.subtotal), 0))
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
  if (!authenticated.value) { clearWishlist(); cart.value = []; return }
  try {
    const [, nextCart] = await Promise.all([refreshWishlist(), api.getCart()])
    cart.value = nextCart || []
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '商城账户数据加载失败' }
}

const openProduct = async (productId: number) => {
  error.value = ''
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

const addToCart = async (productId: number) => {
  if (!(await requireLogin())) return
  actionId.value = productId
  error.value = ''
  try {
    await api.addToCart(productId, 1)
    cart.value = await api.getCart() || []
    selected.value = null
    cartOpen.value = true
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '加入购物车失败' }
  finally { actionId.value = null }
}

const removeFromCart = async (productId: number) => {
  actionId.value = productId
  try { await api.removeFromCart(productId); cart.value = await api.getCart() || [] }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '移出购物车失败' }
  finally { actionId.value = null }
}

const openCart = async () => {
  if (!(await requireLogin())) return
  cart.value = await api.getCart() || []
  cartOpen.value = true
}

const openCheckout = () => openCommerceCheckout(cartOpen, checkoutOpen)

const submitOrder = async () => {
  checkoutLoading.value = true
  error.value = ''
  try {
    const orderId = await api.createOrder(shippingAddress.value)
    cart.value = []
    checkoutOpen.value = false
    cartOpen.value = false
    await navigateTo(`/shop/orders/${orderId}`)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '创建订单失败' }
  finally { checkoutLoading.value = false }
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
        <button class="button button-primary product-cart-button" :disabled="actionId === product.id" @click="addToCart(product.id)">加入购物车</button>
      </article>
    </div>
    <p v-else class="empty-state">{{ t('shop.empty') }}</p>
    <p class="shop-note">已接入 Mystikos 商城服务 <span v-if="wishlist.length">· {{ wishlist.length }} 件心愿商品</span></p>
  </section>

  <Teleport to="body"><Transition name="fade"><div v-if="selected" class="product-modal-backdrop" role="presentation" @click.self="selected = null"><section class="product-modal" role="dialog" aria-modal="true" :aria-label="selected.name"><button class="modal-close" :aria-label="t('modal.close')" @click="selected = null">×</button><img :src="imageFor(selected)" :alt="selected.name"><div><p class="eyebrow"><span />分类 {{ selected.categoryId }}</p><h2>{{ selected.name }}</h2><strong>{{ money(selected.price) }}</strong><p>{{ selected.description }}</p><div class="commerce-actions"><button class="button" @click="toggleWishlist(selected.id)">{{ wishlistIds.has(selected.id) ? t('modal.remove') : t('shop.wishlist') }}</button><button class="button button-primary" @click="addToCart(selected.id)">加入购物车</button></div></div></section></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="cartOpen" class="commerce-drawer-backdrop" @click.self="cartOpen = false"><aside class="commerce-drawer" aria-label="购物车"><header><div><p class="eyebrow"><span />CART</p><h2>购物车</h2></div><button class="modal-close" @click="cartOpen = false">×</button></header><div v-if="cart.length" class="cart-lines"><article v-for="line in cart" :key="line.productId"><div><h3>{{ line.productName }}</h3><p>{{ money(line.unitPrice) }} × {{ line.quantity }}</p></div><strong>{{ money(line.subtotal) }}</strong><button :disabled="actionId === line.productId" @click="removeFromCart(line.productId)">移除</button></article></div><p v-else class="empty-state">购物车还是空的。</p><footer v-if="cart.length"><p><span>合计</span><strong>{{ money(cartTotal) }}</strong></p><button class="button button-primary" @click="openCheckout">填写地址并结算</button></footer></aside></div></Transition></Teleport>

  <Teleport to="body"><Transition name="fade"><div v-if="checkoutOpen" class="product-modal-backdrop" @click.self="checkoutOpen = false"><section class="checkout-modal" role="dialog" aria-modal="true" aria-label="创建商城订单"><button class="modal-close" @click="checkoutOpen = false">×</button><p class="eyebrow"><span />CHECKOUT</p><h2>确认收货信息</h2><p>订单将使用当前购物车中的 {{ cartCount }} 件商品。</p><label for="shipping-address">收货地址</label><textarea id="shipping-address" v-model="shippingAddress" rows="4" placeholder="请输入完整收货地址" /><p class="checkout-total">合计 <strong>{{ money(cartTotal) }}</strong></p><button class="button button-primary" :disabled="checkoutLoading || !shippingAddress.trim()" @click="submitOrder">{{ checkoutLoading ? '正在创建订单…' : '提交订单' }}</button></section></div></Transition></Teleport>
</template>
