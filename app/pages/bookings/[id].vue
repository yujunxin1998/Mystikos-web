<script setup lang="ts">
import type { BookingOrderView } from '../../composables/useBookingApi'
import type { PaymentCheckout, PaymentProvider, PaymentScene } from '../../composables/useCommerceApi'

const route = useRoute()
const api = useBookingApi()
const booking = ref<BookingOrderView | null>(null)
const payment = ref<PaymentCheckout | null>(null)
const loading = ref(true)
const working = ref(false)
const error = ref('')
const bookingId = computed(() => String(route.params.id))
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)

const provider = ref<PaymentProvider>('STRIPE')
const scenesByProvider: Record<PaymentProvider, PaymentScene[]> = { STRIPE: ['DEFAULT'], ALIPAY: ['PC_QR', 'WAP_H5', 'APP'], WECHAT_PAY: ['PC_QR', 'WAP_H5', 'APP'] }
const scene = ref<PaymentScene>('DEFAULT')
const sceneLabels: Record<PaymentScene, string> = { DEFAULT: '默认', PC_QR: 'PC 扫码', WAP_H5: '手机 H5', APP: 'App 调起' }

const remainingSeconds = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const countdownLabel = computed(() => {
  if (remainingSeconds.value <= 0) return ''
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
})
const startCountdown = () => {
  if (countdownTimer) clearInterval(countdownTimer)
  const tick = () => {
    if (!booking.value?.expiresAt) { remainingSeconds.value = 0; return }
    remainingSeconds.value = Math.max(Math.floor((new Date(booking.value.expiresAt).getTime() - Date.now()) / 1000), 0)
  }
  tick()
  countdownTimer = setInterval(tick, 1000)
}

const payableStatus = (status: string) => status === 'DRAFT' || status === 'PENDING_PAYMENT'

const loadBooking = async () => {
  loading.value = true
  error.value = ''
  try {
    booking.value = await api.getBooking(bookingId.value)
    if (payableStatus(booking.value.status)) startCountdown()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '预约加载失败' }
  finally { loading.value = false }
}

const cancelBooking = async () => {
  working.value = true
  try { await api.cancelBooking(bookingId.value); await loadBooking() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '取消预约失败' }
  finally { working.value = false }
}

const requestPayment = async () => {
  working.value = true
  error.value = ''
  try { payment.value = await api.requestBookingPayment(bookingId.value, provider.value, scene.value); await loadBooking() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '发起支付失败' }
  finally { working.value = false }
}

watch(provider, next => { scene.value = scenesByProvider[next][0] ?? 'DEFAULT' })
onMounted(loadBooking)
onBeforeUnmount(() => { if (countdownTimer) clearInterval(countdownTimer) })
</script>

<template>
  <section class="commerce-order-page section-wrap">
    <NuxtLink to="/companions" class="commerce-back">← 返回陪玩列表</NuxtLink>
    <p v-if="loading" class="empty-state">正在读取预约…</p>
    <p v-else-if="error && !booking" class="commerce-alert" role="alert">{{ error }}</p>
    <template v-else-if="booking">
      <header><div><p class="eyebrow"><span />BOOKING {{ booking.id }}</p><h1>预约详情</h1></div><span class="order-status">{{ booking.status }}</span></header>
      <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
      <p v-if="countdownLabel && payableStatus(booking.status)" class="order-countdown">请在 <strong>{{ countdownLabel }}</strong> 内完成支付，超时预约将自动失效</p>

      <section class="order-card">
        <article><div><h2>陪玩 #{{ booking.companionId }}</h2><p>{{ new Date(booking.start).toLocaleString() }} → {{ new Date(booking.end).toLocaleString() }} · {{ booking.durationHours }} 小时</p></div><strong>{{ money(booking.priceSnapshot) }}</strong></article>
        <footer><span>合计</span><strong>{{ money(booking.priceSnapshot) }}</strong></footer>
      </section>

      <section v-if="payableStatus(booking.status)" class="payment-method-picker">
        <p class="eyebrow"><span />PAYMENT METHOD</p>
        <div class="provider-list">
          <button v-for="p in (['STRIPE', 'ALIPAY', 'WECHAT_PAY'] as PaymentProvider[])" :key="p" type="button" :class="{ active: provider === p }" @click="provider = p">{{ p === 'STRIPE' ? '信用卡（Stripe）' : p === 'ALIPAY' ? '支付宝' : '微信支付' }}</button>
        </div>
        <div v-if="scenesByProvider[provider].length > 1" class="scene-list">
          <button v-for="s in scenesByProvider[provider]" :key="s" type="button" :class="{ active: scene === s }" @click="scene = s">{{ sceneLabels[s] }}</button>
        </div>
      </section>

      <div class="commerce-actions"><button class="button" :disabled="working" @click="cancelBooking">取消预约</button><button class="button button-primary" :disabled="working" @click="requestPayment">发起支付</button></div>
      <section v-if="payment" class="payment-notice">
        <h2>支付已初始化</h2>
        <p>支付状态：{{ payment.status }}，结果类型：{{ payment.payloadType }}。</p>
        <p v-if="payment.payloadType === 'QR_CODE'">请使用{{ provider === 'ALIPAY' ? '支付宝' : '微信' }} App 扫描二维码完成支付：<code>{{ payment.payload.qrCode }}</code></p>
        <p v-else-if="payment.payloadType === 'REDIRECT_URL'"><a :href="payment.payload.redirectUrl" target="_blank" rel="noopener">前往支付页面 →</a></p>
        <p v-else-if="payment.payloadType === 'APP_INVOKE_PARAMS'">请在 App 内调起对应支付 SDK，调起参数已就绪。</p>
        <p v-else>后端已返回 Stripe client secret；配置 Stripe Payment Element 后即可完成银行卡支付。</p>
        <code>Intent #{{ payment.intentId }}</code>
      </section>
    </template>
  </section>
</template>

<style scoped>
.order-countdown { padding: 8px 14px; border: 1px solid var(--gold); border-radius: 10px; color: var(--gold); font-size: 13px; }
.payment-method-picker { display: grid; gap: 10px; }
.provider-list, .scene-list { display: flex; gap: 8px; flex-wrap: wrap; }
.provider-list button, .scene-list button { padding: 8px 14px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); color: var(--ink); cursor: pointer; }
.provider-list button.active, .scene-list button.active { border-color: var(--gold); background: var(--gold); color: #1a1400; }
.payment-notice code { display: block; margin-top: 8px; padding: 8px; border-radius: 8px; background: var(--card); word-break: break-all; }
</style>
