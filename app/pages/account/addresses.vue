<script setup lang="ts">
import type { Address, AddressPayload, AddressType } from '../../composables/useCommerceApi'

const { authenticated } = useDemoAuth()
const { addresses, loading, refresh, create, update, remove, setDefault } = useAddressBook()
const { countries, provincesOf, load: loadRegions } = useRegions()

const editing = ref<Address | null>(null)
const formOpen = ref(false)
const saving = ref(false)
const error = ref('')

const emptyForm = (): AddressPayload => ({
  addressType: 'DOMESTIC', recipientName: '', phone: '', countryCode: 'CN', provinceCode: '',
  city: '', district: '', addressLine1: '', addressLine2: '', stateRegion: '', postalCode: '', setDefault: false
})
const form = ref<AddressPayload>(emptyForm())

const overseasCountries = computed(() => countries.value.filter(c => c.code !== 'CN'))
const domesticProvinces = computed(() => provincesOf('CN'))

const openCreate = () => { editing.value = null; form.value = emptyForm(); formOpen.value = true; error.value = '' }
const openEdit = (address: Address) => {
  editing.value = address
  form.value = {
    addressType: address.addressType, recipientName: address.recipientName, phone: address.phone,
    countryCode: address.countryCode, provinceCode: address.provinceCode || '', city: address.city || '',
    district: address.district || '', addressLine1: address.addressLine1, addressLine2: address.addressLine2 || '',
    stateRegion: address.stateRegion || '', postalCode: address.postalCode || '', setDefault: address.isDefault
  }
  formOpen.value = true
  error.value = ''
}
const closeForm = () => { formOpen.value = false; editing.value = null }

const switchType = (type: AddressType) => {
  form.value.addressType = type
  if (type === 'DOMESTIC') { form.value.countryCode = 'CN'; form.value.stateRegion = '' }
  else { form.value.countryCode = ''; form.value.provinceCode = ''; form.value.district = '' }
}

const submit = async () => {
  saving.value = true
  error.value = ''
  try {
    const payload: AddressPayload = { ...form.value }
    if (payload.addressType === 'DOMESTIC') { payload.stateRegion = null }
    else { payload.provinceCode = null; payload.district = null }
    if (editing.value) await update(editing.value.id, payload)
    else await create(payload)
    closeForm()
  } catch (cause) { error.value = cause instanceof Error ? cause.message : '保存地址失败' }
  finally { saving.value = false }
}

const removeAddress = async (address: Address) => {
  error.value = ''
  try { await remove(address.id) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '删除地址失败' }
}

const makeDefault = async (address: Address) => {
  error.value = ''
  try { await setDefault(address.id) }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '设置默认地址失败' }
}

onMounted(async () => {
  if (!authenticated.value) return navigateTo('/auth?redirect=/account/addresses')
  await Promise.all([refresh(), loadRegions()])
})
</script>

<template>
  <section class="addresses-page section-wrap">
    <NuxtLink to="/shop" class="commerce-back">← 返回商城</NuxtLink>
    <header class="addresses-header">
      <div><p class="eyebrow"><span />ADDRESS BOOK</p><h1>收货地址簿</h1><p>结算时可以从这里选择一个地址；国内/海外地址需要填写的字段不同。</p></div>
      <button class="button button-primary" type="button" @click="openCreate">新增地址</button>
    </header>

    <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
    <p v-if="loading" class="empty-state">正在加载地址簿…</p>
    <p v-else-if="!addresses.length" class="empty-state">还没有保存的地址，点击"新增地址"添加一个。</p>
    <div v-else class="address-grid">
      <article v-for="address in addresses" :key="address.id" class="address-card" :class="{ default: address.isDefault }">
        <header>
          <span class="address-type-badge">{{ address.addressType === 'DOMESTIC' ? '国内' : '海外' }}</span>
          <span v-if="address.isDefault" class="address-default-badge">默认</span>
        </header>
        <strong>{{ address.recipientName }} · {{ address.phone }}</strong>
        <p v-if="address.addressType === 'DOMESTIC'">{{ address.city }}{{ address.district }} {{ address.addressLine1 }}</p>
        <p v-else>{{ address.city }}<template v-if="address.stateRegion"> · {{ address.stateRegion }}</template> · {{ address.countryCode }} {{ address.addressLine1 }}</p>
        <p v-if="address.postalCode" class="address-postal">邮编 {{ address.postalCode }}</p>
        <footer>
          <button type="button" @click="openEdit(address)">编辑</button>
          <button v-if="!address.isDefault" type="button" @click="makeDefault(address)">设为默认</button>
          <button type="button" class="danger" @click="removeAddress(address)">删除</button>
        </footer>
      </article>
    </div>

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="formOpen" class="product-modal-backdrop" role="presentation" @click.self="closeForm">
          <section class="address-form-modal" role="dialog" aria-modal="true" :aria-label="editing ? '编辑地址' : '新增地址'">
            <button class="modal-close" aria-label="关闭" @click="closeForm">×</button>
            <p class="eyebrow"><span />{{ editing ? 'EDIT ADDRESS' : 'NEW ADDRESS' }}</p>
            <h2>{{ editing ? '编辑地址' : '新增地址' }}</h2>

            <div class="address-type-toggle" role="tablist">
              <button type="button" :class="{ active: form.addressType === 'DOMESTIC' }" @click="switchType('DOMESTIC')">国内地址</button>
              <button type="button" :class="{ active: form.addressType === 'OVERSEAS' }" @click="switchType('OVERSEAS')">海外地址</button>
            </div>

            <form class="address-form" @submit.prevent="submit">
              <label>收件人姓名<input v-model="form.recipientName" required></label>
              <label>联系电话<input v-model="form.phone" required></label>

              <template v-if="form.addressType === 'DOMESTIC'">
                <label>省份
                  <select v-model="form.provinceCode" required>
                    <option value="" disabled>请选择省份</option>
                    <option v-for="province in domesticProvinces" :key="province.code" :value="province.code">{{ province.nameZh }}</option>
                  </select>
                </label>
                <label>城市<input v-model="form.city" required></label>
                <label>区/县<input v-model="form.district" required></label>
              </template>
              <template v-else>
                <label>国家
                  <select v-model="form.countryCode" required>
                    <option value="" disabled>请选择国家</option>
                    <option v-for="country in overseasCountries" :key="country.code" :value="country.code">{{ country.nameZh }}</option>
                  </select>
                </label>
                <label>城市<input v-model="form.city" required></label>
                <label>州/大区（可选）<input v-model="form.stateRegion"></label>
              </template>

              <label class="address-form-wide">详细地址<input v-model="form.addressLine1" required></label>
              <label class="address-form-wide">详细地址补充（可选）<input v-model="form.addressLine2"></label>
              <label>邮政编码（可选）<input v-model="form.postalCode"></label>
              <label class="address-form-checkbox"><input v-model="form.setDefault" type="checkbox"> 设为默认地址</label>

              <p v-if="error" class="commerce-alert" role="alert">{{ error }}</p>
              <button class="button button-primary" type="submit" :disabled="saving">{{ saving ? '正在保存…' : '保存地址' }}</button>
            </form>
          </section>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
.addresses-page { padding-top: 42px; padding-bottom: 62px; display: grid; gap: 22px; }
.addresses-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.address-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.address-card { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--card); }
.address-card.default { border-color: var(--gold); }
.address-card header { display: flex; gap: 8px; align-items: center; }
.address-type-badge { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); font-size: 11px; color: var(--muted); }
.address-default-badge { padding: 2px 8px; border-radius: 999px; background: var(--gold); color: #1a1400; font-size: 11px; }
.address-card p { margin: 0; color: var(--muted); font-size: 13px; }
.address-postal { font-size: 12px; }
.address-card footer { display: flex; gap: 10px; margin-top: 6px; }
.address-card footer button { padding: 0; border: 0; background: none; color: var(--lav-deep); font-size: 12px; cursor: pointer; }
.address-card footer button.danger { color: #d1495b; }
.address-form-modal { position: relative; width: min(560px, 92vw); max-height: 86vh; overflow-y: auto; padding: 28px; border: 1px solid var(--line); border-radius: 22px; background: var(--paper); }
.address-type-toggle { display: flex; gap: 8px; margin: 14px 0; }
.address-type-toggle button { flex: 1; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: transparent; color: var(--ink); cursor: pointer; }
.address-type-toggle button.active { border-color: var(--gold); background: var(--card); }
.address-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.address-form label { display: grid; gap: 4px; font-size: 12px; color: var(--muted); }
.address-form input, .address-form select { padding: 9px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); }
.address-form-wide { grid-column: 1 / -1; }
.address-form-checkbox { grid-column: 1 / -1; display: flex; flex-direction: row; align-items: center; gap: 8px; }
.address-form button[type="submit"] { grid-column: 1 / -1; margin-top: 6px; }
@media (max-width: 600px) { .address-form { grid-template-columns: 1fr; } }
</style>
