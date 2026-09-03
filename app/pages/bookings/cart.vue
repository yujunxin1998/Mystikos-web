<script setup lang="ts">
import type { BookingCartLineView } from '../../composables/useBookingApi'

const { authenticated } = useDemoAuth()
const api = useBookingApi()
const lines = ref<BookingCartLineView[]>([])
const selectedIds = ref<Set<string>>(new Set())
const loading = ref(true)
const actionId = ref<string | null>(null)
const checkoutLoading = ref(false)
const error = ref('')

const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
const selectedLines = computed(() => lines.value.filter(line => selectedIds.value.has(String(line.id))))
const total = computed(() => selectedLines.value.reduce((sum, line) => sum + Number(line.estimatedPrice), 0))
const allSelected = computed(() => lines.value.length > 0 && selectedIds.value.size === lines.value.length)

const loadCart = async () => {
  loading.value = true
  error.value = ''
  try {
    lines.value = await api.listBookingCart() || []
    selectedIds.value = new Set(lines.value.map(line => String(line.id)))
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '点单车加载失败' }
  finally { loading.value = false }
}

const toggleLine = (id: string) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}
const toggleSelectAll = () => { selectedIds.value = allSelected.value ? new Set() : new Set(lines.value.map(line => String(line.id))) }

const removeLine = async (id: string) => {
  actionId.value = id
  try { await api.removeBookingCartLine(id); await loadCart() }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '移出点单车失败' }
  finally { actionId.value = null }
}

const checkout = async () => {
  if (!selectedLines.value.length) return
  checkoutLoading.value = true
  error.value = ''
  try {
    const groupId = await api.checkoutBookingCart(selectedLines.value.map(line => line.id))
    await navigateTo(`/bookings/groups/${groupId}`)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '结算点单车失败' }
  finally { checkoutLoading.value = false }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth?redirect=/bookings/cart')
  await loadCart()
})
</script>

<template>
  <section class="commerce-order-page section-wrap">
    <NuxtLink to="/companions" class="commerce-back">← 返回陪玩列表</NuxtLink>
    <header><div><p class="eyebrow"><span />BOOKING CART</p><h1>点单车</h1></div></header>
    <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
    <p v-if="loading" class="empty-state">正在加载点单车…</p>
    <p v-else-if="!lines.length" class="empty-state">点单车还是空的，去陪玩详情页加一些吧。</p>
    <template v-else>
      <label class="cart-select-all"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll"> 全选</label>
      <section class="order-card">
        <article v-for="line in lines" :key="String(line.id)">
          <label class="cart-line-checkbox"><input type="checkbox" :checked="selectedIds.has(String(line.id))" @change="toggleLine(String(line.id))"></label>
          <div>
            <h2>陪玩 #{{ line.companionId }}{{ !line.companionBookable ? '（当前不可点单）' : '' }}</h2>
            <p>{{ new Date(line.start).toLocaleString() }} → {{ new Date(line.end).toLocaleString() }} · {{ line.durationHours }} 小时</p>
          </div>
          <strong>{{ money(line.estimatedPrice) }}</strong>
          <button :disabled="actionId === String(line.id)" @click="removeLine(String(line.id))">移除</button>
        </article>
        <footer><span>合计（已选 {{ selectedLines.length }} 条）</span><strong>{{ money(total) }}</strong></footer>
      </section>
      <div class="commerce-actions"><button class="button button-primary" :disabled="checkoutLoading || !selectedLines.length" @click="checkout">{{ checkoutLoading ? '正在结算…' : '去支付' }}</button></div>
    </template>
  </section>
</template>

<style scoped>
.cart-select-all { display: flex; align-items: center; gap: 8px; padding: 0 4px 10px; font-size: 12px; color: var(--muted); }
.cart-line-checkbox { display: flex; align-items: center; margin-right: 10px; }
.order-card article { display: flex; align-items: center; gap: 10px; }
.order-card article button { margin-left: 8px; }
</style>
