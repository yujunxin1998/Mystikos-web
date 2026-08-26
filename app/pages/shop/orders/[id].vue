<script setup lang="ts">
import type { CommerceOrder, PaymentCheckout } from '../../../composables/useCommerceApi'

const route = useRoute()
const api = useCommerceApi()
const order = ref<CommerceOrder | null>(null)
const payment = ref<PaymentCheckout | null>(null)
const loading = ref(true)
const working = ref(false)
const error = ref('')
const orderId = computed(() => String(route.params.id))
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)

const loadOrder = async () => {
  loading.value = true
  error.value = ''
  try { order.value = await api.getOrder(orderId.value) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '订单加载失败' }
  finally { loading.value = false }
}

const cancelOrder = async () => {
  working.value = true
  try { await api.cancelOrder(orderId.value); await loadOrder() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '取消订单失败' }
  finally { working.value = false }
}

const requestPayment = async () => {
  working.value = true
  try { payment.value = await api.requestPayment(orderId.value) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '发起支付失败' }
  finally { working.value = false }
}

onMounted(loadOrder)
</script>

<template>
  <section class="commerce-order-page section-wrap">
    <NuxtLink to="/shop" class="commerce-back">← 返回商城</NuxtLink>
    <p v-if="loading" class="empty-state">正在读取订单…</p>
    <p v-else-if="error && !order" class="commerce-alert" role="alert">{{ error }}</p>
    <template v-else-if="order">
      <header><div><p class="eyebrow"><span />ORDER {{ order.orderId }}</p><h1>订单详情</h1></div><span class="order-status">{{ order.status }}</span></header>
      <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
      <section class="order-card"><article v-for="item in order.items" :key="item.productId"><div><h2>{{ item.productNameSnapshot }}</h2><p>{{ money(item.unitPriceSnapshot) }} × {{ item.quantity }}</p></div><strong>{{ money(item.subtotal) }}</strong></article><footer><span>订单总额</span><strong>{{ money(order.totalAmount) }}</strong></footer></section>
      <section class="order-meta"><div><small>收货地址</small><p>{{ order.shippingAddress }}</p></div><div><small>创建时间</small><p>{{ new Date(order.createdAt).toLocaleString() }}</p></div></section>
      <div class="commerce-actions"><button class="button" :disabled="working" @click="cancelOrder">取消订单</button><button class="button button-primary" :disabled="working" @click="requestPayment">发起支付</button></div>
      <section v-if="payment" class="payment-notice"><h2>支付已初始化</h2><p>支付状态：{{ payment.status }}。后端已返回 Stripe client secret；配置 Stripe Payment Element 后即可完成银行卡支付。</p><code>Intent #{{ payment.intentId }}</code></section>
    </template>
  </section>
</template>
