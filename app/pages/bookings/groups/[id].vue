<script setup lang="ts">
import type { BookingOrderGroupView } from '../../../composables/useBookingApi'
import type { PaymentCheckout, PaymentProvider, PaymentScene } from '../../../composables/useCommerceApi'

const route = useRoute()
const api = useBookingApi()
const group = ref<BookingOrderGroupView | null>(null)
const payment = ref<PaymentCheckout | null>(null)
const loading = ref(true)
const working = ref(false)
const error = ref('')
const groupId = computed(() => String(route.params.id))
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
    if (!group.value?.expiresAt) { remainingSeconds.value = 0; return }
    remainingSeconds.value = Math.max(Math.floor((new Date(group.value.expiresAt).getTime() - Date.now()) / 1000), 0)
  }
  tick()
  countdownTimer = setInterval(tick, 1000)
}
const payableStatus = (status: string) => status === 'DRAFT' || status === 'PENDING_PAYMENT'

const loadGroup = async () => {
  loading.value = true
  error.value = ''
  try {
    group.value = await api.getBookingGroup(groupId.value)
    if (payableStatus(group.value.status)) startCountdown()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '点单组加载失败' }
  finally { loading.value = false }
}

const cancelGroup = async () => {
  working.value = true
  try { await api.cancelGroup(groupId.value); await loadGroup() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '取消点单组失败' }
  finally { working.value = false }
}

const requestPayment = async () => {
  working.value = true
  error.value = ''
  try { payment.value = await api.requestGroupPayment(groupId.value, provider.value, scene.value); await loadGroup() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '发起支付失败' }
  finally { working.value = false }
}

watch(provider, next => { scene.value = scenesByProvider[next][0] ?? 'DEFAULT' })
onMounted(loadGroup)
onBeforeUnmount(() => { if (countdownTimer) clearInterval(countdownTimer) })
</script>

<template>
  <section class="commerce-order-page section-wrap">
    <NuxtLink to="/bookings/cart" class="commerce-back">← 返回点单车</NuxtLink>
    <p v-if="loading" class="empty-state">正在读取点单组…</p>
    <p v-else-if="error && !group" class="commerce-alert" role="alert">{{ error }}</p>
    <template v-else-if="group">
      <header><div><p class="eyebrow"><span />BOOKING GROUP {{ group.id }}</p><h1>合并支付</h1></div><span class="order-status">{{ group.status }}</span></header>
      <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
      <p v-if="countdownLabel && payableStatus(group.status)" class="order-countdown">请在 <strong>{{ countdownLabel }}</strong> 内完成支付，超时点单组将自动失效</p>

      <section class="order-card">
        <article v-for="booking in group.bookings" :key="String(booking.id)">
          <div>
            <h2>陪玩 #{{ booking.companionId }} <small>· {{ booking.status }}</small></h2>
            <p>{{ new Date(booking.start).toLocaleString() }} → {{ new Date(booking.end).toLocaleString() }} · {{ booking.durationHours }} 小时</p>
          </div>
          <strong>{{ money(booking.priceSnapshot) }}</strong>
        </article>
        <footer><span>合计</span><strong>{{ money(group.totalAmount) }}</strong></footer>
      </section>

      <section v-if="payableStatus(group.status)" class="payment-method-picker">
        <p class="eyebrow"><span />PAYMENT METHOD</p>
        <div class="provider-list">
          <button v-for="p in (['STRIPE', 'ALIPAY', 'WECHAT_PAY'] as PaymentProvider[])" :key="p" type="button" :class="{ active: provider === p }" @click="provider = p">{{ p === 'STRIPE' ? '信用卡（Stripe）' : p === 'ALIPAY' ? '支付宝' : '微信支付' }}</button>
        </div>
        <div v-if="scenesByProvider[provider].length > 1" class="scene-list">
          <button v-for="s in scenesByProvider[provider]" :key="s" type="button" :class="{ active: scene === s }" @click="scene = s">{{ sceneLabels[s] }}</button>
        </div>
      </section>

      <div v-if="payableStatus(group.status)" class="commerce-actions"><button class="button" :disabled="working" @click="cancelGroup">取消点单组</button><button class="button button-primary" :disabled="working" @click="requestPayment">发起支付</button></div>
      <p v-else class="hint">支付后每条点单会各自进入撮合流程，请到「我的点单」分别查看进度。</p>

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
.hint { color: var(--muted); font-size: 13px; }
</style>
